import { ResourceManager } from '../components/ResourceManager';
import {
  FileField,
  NumberField,
  SelectField,
  TagsField,
  TextAreaField,
  TextField,
  ToggleField,
} from '../forms/Fields';
import { resolveFileUrl } from '@/lib/apiClient';
import { PROJECT_CATEGORIES, type Project, type ProjectCategory } from '@/types/api';

interface ProjectForm {
  title: string;
  subtitle: string;
  category: ProjectCategory;
  description: string;
  problem: string;
  solution: string;
  impact: string;
  techStack: string[];
  githubUrl: string;
  liveUrl: string;
  imageUrl: string | null;
  completedOn: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
}

/** Empty strings are dropped: the DTO rejects "" for @IsUrl fields. */
const optional = (value: string) => (value.trim() ? value.trim() : undefined);

export function ProjectsPage() {
  return (
    <ResourceManager<Project, ProjectForm>
      config={{
        endpoint: '/projects',
        listEndpoint: '/projects/admin/all',
        title: 'Project',
        description: 'Entries in the Featured Projects grid.',
        keyOf: (item) => item.id,
        labelOf: (item) => item.title,
        emptyForm: {
          title: '',
          subtitle: '',
          category: 'Microservices',
          description: '',
          problem: '',
          solution: '',
          impact: '',
          techStack: [],
          githubUrl: '',
          liveUrl: '',
          imageUrl: null,
          completedOn: '',
          isFeatured: false,
          isPublished: true,
          sortOrder: 0,
        },
        toForm: (item) => ({
          title: item.title,
          subtitle: item.subtitle ?? '',
          category: item.category,
          description: item.description,
          problem: item.problem ?? '',
          solution: item.solution ?? '',
          impact: item.impact ?? '',
          techStack: item.techStack,
          githubUrl: item.githubUrl ?? '',
          liveUrl: item.liveUrl ?? '',
          imageUrl: item.imageUrl,
          completedOn: item.completedOn ?? '',
          isFeatured: item.isFeatured,
          isPublished: item.isPublished,
          sortOrder: item.sortOrder,
        }),
        toPayload: (form) => ({
          title: form.title,
          subtitle: optional(form.subtitle),
          category: form.category,
          description: form.description,
          problem: optional(form.problem),
          solution: optional(form.solution),
          impact: optional(form.impact),
          techStack: form.techStack,
          githubUrl: optional(form.githubUrl),
          liveUrl: optional(form.liveUrl),
          imageUrl: form.imageUrl ?? undefined,
          completedOn: optional(form.completedOn),
          isFeatured: form.isFeatured,
          isPublished: form.isPublished,
          sortOrder: form.sortOrder,
        }),
        renderRow: (item) => {
          const image = resolveFileUrl(item.imageUrl);
          return (
            <div className="flex items-center gap-3">
              {image ? (
                <img
                  src={image}
                  alt=""
                  className="h-10 w-14 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="h-10 w-14 shrink-0 rounded-lg bg-white/[0.06]" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-200">
                  {item.title}
                  {item.isFeatured && (
                    <span className="ml-2 rounded border border-violet-accent/30 px-1.5 py-0.5 text-[0.6rem] text-violet-300">
                      Featured
                    </span>
                  )}
                  {!item.isPublished && (
                    <span className="ml-2 rounded border border-amber-400/30 px-1.5 py-0.5 text-[0.6rem] text-amber-300">
                      Draft
                    </span>
                  )}
                </p>
                <p className="truncate text-[0.72rem] text-slate-500">
                  {item.category} · {item.techStack.slice(0, 3).join(', ')}
                </p>
              </div>
            </div>
          );
        },
        renderForm: (form, set) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Title"
                value={form.title}
                onChange={(v) => set('title', v)}
                required
              />
              <TextField
                label="Subtitle"
                value={form.subtitle}
                onChange={(v) => set('subtitle', v)}
              />
            </div>

            <SelectField
              label="Category"
              value={form.category}
              options={PROJECT_CATEGORIES}
              onChange={(v) => set('category', v)}
              required
            />

            <FileField
              label="Thumbnail image"
              value={form.imageUrl}
              onChange={(url) => set('imageUrl', url)}
              endpoint="/uploads/project-image"
              accept="image/*"
              hint="images/featuredproject"
            />

            <TextAreaField
              label="Description"
              value={form.description}
              onChange={(v) => set('description', v)}
              required
            />

            <TextAreaField
              label="Problem"
              value={form.problem}
              onChange={(v) => set('problem', v)}
              rows={3}
            />
            <TextAreaField
              label="Solution"
              value={form.solution}
              onChange={(v) => set('solution', v)}
              rows={3}
            />
            <TextAreaField
              label="Impact"
              value={form.impact}
              onChange={(v) => set('impact', v)}
              rows={3}
            />

            <TagsField
              label="Tech stack"
              value={form.techStack}
              onChange={(v) => set('techStack', v)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="GitHub URL"
                value={form.githubUrl}
                onChange={(v) => set('githubUrl', v)}
              />
              <TextField
                label="Live demo URL"
                value={form.liveUrl}
                onChange={(v) => set('liveUrl', v)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Completed on"
                value={form.completedOn}
                onChange={(v) => set('completedOn', v)}
                hint="e.g. Mar 2025"
              />
              <NumberField
                label="Sort order"
                value={form.sortOrder}
                onChange={(v) => set('sortOrder', v)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleField
                label="Featured"
                value={form.isFeatured}
                onChange={(v) => set('isFeatured', v)}
              />
              <ToggleField
                label="Published"
                value={form.isPublished}
                onChange={(v) => set('isPublished', v)}
              />
            </div>
          </>
        ),
      }}
    />
  );
}
