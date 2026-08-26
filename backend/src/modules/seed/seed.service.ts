import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { constants as fsConstants, promises as fs } from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { Award } from '../awards/entities/award.entity';
import {
  Certification,
  CertificationCategory,
} from '../certifications/entities/certification.entity';
import { DocumentSyncService } from '../documents/document-sync.service';
import {
  Document,
  DocumentDomain,
  DocumentFileType,
} from '../documents/entities/document.entity';
import { Profile } from '../profile/entities/profile.entity';
import {
  Project,
  ProjectCategory,
} from '../projects/entities/project.entity';
import { ServiceOffering } from '../services/entities/service-offering.entity';

/**
 * Idempotent seed: skips any table that already has rows, so running it twice
 * never duplicates content.
 */
@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  /**
   * Stored relative, not absolute. A relative path keeps working when the API
   * moves host or port, and resolveFileUrl on the client turns it into a
   * same-origin request through the dev proxy.
   */
  static readonly LOCAL_AVATAR_URL =
    '/static/images/avatar/profile-picture-avatar.jpg';

  constructor(
    @InjectRepository(Profile) private readonly profileRepo: Repository<Profile>,
    @InjectRepository(ServiceOffering)
    private readonly serviceRepo: Repository<ServiceOffering>,
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    @InjectRepository(Certification)
    private readonly certRepo: Repository<Certification>,
    @InjectRepository(Award) private readonly awardRepo: Repository<Award>,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly documentSync: DocumentSyncService,
  ) {}

  async run() {
    await this.authService.ensureAdminSeeded();
    await this.seedProfile();
    await this.backfillProfileAvatar();
    await this.seedServices();
    await this.seedProjects();
    // After seedProjects: the rows must exist before images can attach.
    await this.syncProjectImages();
    await this.seedCertifications();
    await this.seedDocuments();
    await this.seedAwards();

    // Reconcile document metadata with whatever is actually in
    // uploads/documents, so sizes and MIME types reflect the real files.
    await this.documentSync.sync();

    this.logger.log('Seed complete.');
  }

  private async seedProfile() {
    if ((await this.profileRepo.count()) > 0) {
      this.logger.log('Profile already seeded, skipping.');
      return;
    }

    await this.profileRepo.save(
      this.profileRepo.create({
        name: 'Aathif Thahir',
        title: 'Software Engineer',
        avatarUrl: SeedService.LOCAL_AVATAR_URL,
        headline: 'I Build Scalable Microservices & Modern Web Applications',
        bio: 'Results-driven Software Engineer with 2.5+ years of experience in backend microservices, Java, Spring Boot, NestJS, and React.js.',
        yearsExperience: '2.5+',
        projectsCompleted: 20,
        happyClients: 12,
        awardsWon: 3,
        email: 'aathifinfo116@gmail.com',
        phone: '+94 77 1281946',
        location: 'Colombo, Sri Lanka',
        socialLinks: [
          {
            platform: 'LinkedIn',
            url: 'https://www.linkedin.com/in/aathif-thahir/',
            icon: 'Linkedin',
          },
          {
            platform: 'GitHub',
            url: 'https://github.com/aathifthahir',
            icon: 'Github',
          },
        ],
        resumeFileName: 'Aathif_Thahir_Resume.pdf',
        isAvailableForHire: true,
        availabilityNote: "Let's build something amazing together!",
      }),
    );
    this.logger.log('Seeded profile.');
  }

  /**
   * Points the profile at the locally stored avatar when that file exists and
   * the column is not already using it. Runs on every seed so an existing
   * database picks the local image up, rather than only fresh installs.
   */
  private async backfillProfileAvatar() {
    const uploadDir = this.config.get<string>('storage.uploadDir', './uploads');
    const absolutePath = path.resolve(
      uploadDir,
      'images',
      'avatar',
      'profile-picture-avatar.jpg',
    );

    try {
      await fs.access(absolutePath, fsConstants.R_OK);
    } catch {
      this.logger.warn(
        `Avatar not found at ${absolutePath}; leaving avatarUrl unchanged.`,
      );
      return;
    }

    const profile = await this.profileRepo.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    if (profile.length === 0) return;

    const current = profile[0].avatarUrl;
    if (current === SeedService.LOCAL_AVATAR_URL) {
      this.logger.log('Profile avatar already points at the local file.');
      return;
    }

    await this.profileRepo.update(profile[0].id, {
      avatarUrl: SeedService.LOCAL_AVATAR_URL,
    });
    this.logger.log(
      `Profile avatar updated: ${current ?? '(none)'} -> ${SeedService.LOCAL_AVATAR_URL}`,
    );
  }

  /**
   * Attaches project preview images by matching a file in
   * uploads/images/featuredproject to a project title.
   *
   * The filename stem is the key: "Claims Integration System.jpg" binds to the
   * project titled "Claims Integration System". Matching is case- and
   * whitespace-insensitive so a stray double space or different casing in a
   * filename still resolves.
   */
  private async syncProjectImages() {
    const uploadDir = this.config.get<string>('storage.uploadDir', './uploads');
    const imageDir = path.resolve(uploadDir, 'images', 'featuredproject');

    let files: string[];
    try {
      files = await fs.readdir(imageDir);
    } catch {
      this.logger.warn(
        `Project image directory not found: ${imageDir}; skipping image sync.`,
      );
      return;
    }

    const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

    // Normalised stem -> filename.
    const byStem = new Map<string, string>();
    for (const file of files) {
      const extension = path.extname(file).toLowerCase();
      if (!IMAGE_EXTENSIONS.includes(extension)) continue;
      byStem.set(SeedService.normaliseKey(path.basename(file, extension)), file);
    }

    if (byStem.size === 0) {
      this.logger.warn('No project images found; skipping image sync.');
      return;
    }

    const projects = await this.projectRepo.find();
    const matched = new Set<string>();
    let updated = 0;

    for (const project of projects) {
      const key = SeedService.normaliseKey(project.title);
      const file = byStem.get(key);

      if (!file) {
        this.logger.warn(`  No image for project: "${project.title}"`);
        continue;
      }

      matched.add(key);
      const url = SeedService.buildStaticUrl(['images', 'featuredproject', file]);

      if (project.imageUrl === url) continue;

      await this.projectRepo.update(project.id, { imageUrl: url });
      this.logger.log(`  ${project.title} -> ${file}`);
      updated += 1;
    }

    for (const [key, file] of byStem) {
      if (!matched.has(key)) {
        this.logger.warn(`  Image with no matching project title: ${file}`);
      }
    }

    this.logger.log(
      `Project images: ${byStem.size} file(s) scanned, ${updated} record(s) updated.`,
    );
  }

  /** Lower-cased, whitespace-collapsed key for tolerant title matching. */
  private static normaliseKey(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  /**
   * Relative /static URL with each path segment percent-encoded.
   *
   * Per-segment encodeURIComponent matters here: "E-Travel & Hotelier
   * System.jpg" contains an ampersand, which encodeURI would leave raw.
   */
  private static buildStaticUrl(segments: string[]): string {
    return `/static/${segments.map((s) => encodeURIComponent(s)).join('/')}`;
  }

  private async seedServices() {
    if ((await this.serviceRepo.count()) > 0) {
      this.logger.log('Services already seeded, skipping.');
      return;
    }

    await this.serviceRepo.save(
      this.serviceRepo.create([
        {
          title: 'Microservices Architecture',
          description:
            'Designing and building resilient, independently deployable services with clean domain boundaries, async messaging, and fault tolerance.',
          iconName: 'Boxes',
          accentGradient: 'from-purple-500 to-indigo-500',
          techTags: ['Java', 'Spring Boot', 'Kafka', 'REST', 'Docker'],
          sortOrder: 1,
        },
        {
          title: 'Full-Stack Development',
          description:
            'End-to-end product delivery with NestJS and React - typed APIs, clean state management, and interfaces that stay fast as they grow.',
          iconName: 'Layers',
          accentGradient: 'from-fuchsia-500 to-purple-500',
          techTags: ['NestJS', 'React', 'TypeScript', 'Tailwind CSS'],
          sortOrder: 2,
        },
        {
          title: 'Cloud & DevOps Integration',
          description:
            'Containerised deployments, CI/CD pipelines, and observability so releases are routine rather than risky.',
          iconName: 'Cloud',
          accentGradient: 'from-blue-500 to-cyan-500',
          techTags: ['Docker', 'Kubernetes', 'CI/CD', 'Azure'],
          sortOrder: 3,
        },
        {
          title: 'Database Design & ER Modelling',
          description:
            'Normalised schemas, considered indexing, and migration strategies that keep query performance predictable at scale.',
          iconName: 'Database',
          accentGradient: 'from-emerald-500 to-teal-500',
          techTags: ['PostgreSQL', 'Oracle', 'TypeORM', 'JPA'],
          sortOrder: 4,
        },
      ]),
    );
    this.logger.log('Seeded 4 services.');
  }

  private async seedProjects() {
    if ((await this.projectRepo.count()) > 0) {
      this.logger.log('Projects already seeded, skipping.');
      return;
    }

    await this.projectRepo.save(
      this.projectRepo.create([
        {
          title: 'Claims Integration System',
          subtitle: 'Allianz Insurance - Enterprise Integration',
          category: ProjectCategory.MICROSERVICES,
          description:
            'A microservice layer connecting the core claims platform with external partner systems, standardising claim intake and settlement flows.',
          problem:
            'Claims data arrived from multiple partner systems in incompatible formats, forcing manual reconciliation and slowing settlement.',
          solution:
            'Built a Spring Boot integration service with a canonical claim model, adapter-per-partner mapping, retry with backoff, and full audit logging.',
          impact:
            'Cut manual reconciliation effort substantially and gave operations end-to-end traceability on every claim.',
          techStack: ['Java', 'Spring Boot', 'REST', 'Oracle', 'Docker'],
          isFeatured: true,
          sortOrder: 1,
        },
        {
          title: 'Bulk Policy Processing System',
          subtitle: 'Allianz Insurance - Batch Processing',
          category: ProjectCategory.MICROSERVICES,
          description:
            'High-throughput batch pipeline for issuing and updating policies in bulk, with validation and per-record error reporting.',
          problem:
            'Bulk policy uploads were processed serially and failed as a whole batch, so one bad row could block thousands of valid policies.',
          solution:
            'Introduced chunked processing with per-record validation, isolated failure handling, and a downloadable error report for operators.',
          impact:
            'Large uploads complete reliably, and failed records are corrected individually instead of re-running the entire batch.',
          techStack: ['Java', 'Spring Batch', 'PostgreSQL', 'Kafka'],
          isFeatured: true,
          sortOrder: 2,
        },
        {
          title: 'E-Travel & Hotelier System',
          subtitle: 'Travel Booking Platform',
          category: ProjectCategory.FULL_STACK,
          description:
            'Booking platform covering hotel inventory, availability search, and reservation management for travellers and hoteliers.',
          problem:
            'Hoteliers had no single place to manage inventory, and travellers could not see live availability.',
          solution:
            'Built a full-stack application with a role-separated hotelier dashboard, availability search, and a reservation lifecycle with confirmations.',
          impact:
            'Gave both sides one system for booking and inventory, removing back-and-forth over email.',
          techStack: ['React', 'Node.js', 'MySQL', 'Express'],
          isFeatured: true,
          sortOrder: 3,
        },
        {
          title: 'Customer Inquiry System',
          subtitle: 'Support Workflow Automation',
          category: ProjectCategory.FULL_STACK,
          description:
            'Inquiry intake and routing tool that assigns incoming customer questions to the right team and tracks them to resolution.',
          problem:
            'Inquiries arrived through scattered channels with no ownership, so responses were slow and inconsistent.',
          solution:
            'Centralised intake with rule-based routing, status tracking, and SLA visibility for supervisors.',
          impact:
            'Every inquiry now has a clear owner and status, making response times measurable for the first time.',
          techStack: ['Spring Boot', 'React', 'PostgreSQL', 'Docker'],
          isFeatured: true,
          sortOrder: 4,
        },
      ]),
    );
    this.logger.log('Seeded 4 projects.');
  }

  private async seedCertifications() {
    if ((await this.certRepo.count()) > 0) {
      this.logger.log('Certifications already seeded, skipping.');
      return;
    }

    await this.certRepo.save(
      this.certRepo.create([
        {
          title:
            'BSc (Hons) in Information Technology, Specialising in Software Engineering',
          institution: 'Sri Lanka Institute of Information Technology (SLIIT)',
          category: CertificationCategory.ACADEMIC_DEGREE,
          description:
            'Four-year honours degree covering software engineering, distributed systems, databases, and software architecture.',
          issuedOn: '2019 - 2023',
          issuedYear: 2023,
          isVerified: true,
          sortOrder: 1,
        },
        {
          title: "Dean's List Award",
          institution: 'Sri Lanka Institute of Information Technology (SLIIT)',
          category: CertificationCategory.ACADEMIC_DEGREE,
          description:
            'Awarded for outstanding academic performance during the academic year.',
          issuedOn: '2022',
          issuedYear: 2022,
          isVerified: true,
          sortOrder: 2,
        },
        {
          title: 'Software Engineer — Professional Experience',
          institution: 'Allianz Insurance Lanka',
          category: CertificationCategory.PROFESSIONAL,
          description:
            'Backend and integration engineering across claims and policy platforms.',
          issuedOn: '2023 - Present',
          issuedYear: 2023,
          isVerified: true,
          sortOrder: 3,
        },
        {
          title: 'Oracle Certified Associate, Java SE Programmer',
          institution: 'Oracle',
          category: CertificationCategory.CERTIFICATION,
          description:
            'Core Java language proficiency: OOP design, collections, generics and exception handling.',
          issuedOn: '2023',
          issuedYear: 2023,
          sortOrder: 4,
        },
      ]),
    );
    this.logger.log('Seeded 4 certifications.');
  }

  /**
   * Documents are no longer seeded from a hardcoded list: DocumentSyncService
   * imports whatever is present under uploads/documents, using the folder name
   * as the domain. Kept as a named step so the seed reads in order.
   */
  private async seedDocuments() {
    const count = await this.documentRepo.count();
    this.logger.log(
      `Documents are imported from disk by the sync step (${count} row(s) currently).`,
    );
  }

  private async seedAwards() {
    if ((await this.awardRepo.count()) > 0) {
      this.logger.log('Awards already seeded, skipping.');
      return;
    }

    await this.awardRepo.save(
      this.awardRepo.create([
        {
          title: 'Best Developer of the 2nd Quarter',
          issuer: 'Allianz Insurance Lanka',
          year: 2025,
          description:
            'Recognised for sustained delivery quality and technical contribution across the claims integration workstream.',
          iconName: 'Trophy',
          sortOrder: 1,
        },
        {
          title: 'Rising Star of the Year',
          issuer: 'Allianz Insurance Lanka',
          year: 2024,
          description:
            'Awarded to the standout early-career engineer for impact and growth across the year.',
          iconName: 'Star',
          sortOrder: 2,
        },
        {
          title: "Dean's List",
          issuer: 'Sri Lanka Institute of Information Technology (SLIIT)',
          year: 2022,
          description:
            'Placed on the faculty Dean\'s List for academic excellence.',
          iconName: 'GraduationCap',
          sortOrder: 3,
        },
      ]),
    );
    this.logger.log('Seeded 3 awards.');
  }
}
