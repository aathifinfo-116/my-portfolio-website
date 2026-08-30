-- ############ PostgreSQL Script Without UUID Generation ############
--
-- Important:
-- Every INSERT statement must explicitly supply a UUID value for "id".
-- Example:
-- INSERT INTO public.awards (id, title, issuer)
-- VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Award Title', 'Issuer');

CREATE TABLE public.admin_users (
id uuid NOT NULL,
"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
email character varying(180) NOT NULL,
"passwordHash" character varying(120) NOT NULL,
"displayName" character varying(120)
DEFAULT 'Administrator'::character varying NOT NULL,
"isActive" boolean DEFAULT true NOT NULL,
"lastLoginAt" timestamp with time zone
);

CREATE TABLE public.awards (
id uuid NOT NULL,
"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
title character varying(200) NOT NULL,
issuer character varying(180) NOT NULL,
year integer,
description text,
"iconName" character varying(60)
DEFAULT 'Trophy'::character varying NOT NULL,
"imageUrl" character varying(500),
"isPublished" boolean DEFAULT true NOT NULL,
"sortOrder" integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.certifications (
id uuid NOT NULL,
"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
title character varying(220) NOT NULL,
institution character varying(180) NOT NULL,
category public.certifications_category_enum
DEFAULT 'Certification'::public.certifications_category_enum
NOT NULL,
description text,
"issuedOn" character varying(60),
"issuedYear" integer,
"documentUrl" character varying(500),
"documentName" character varying(200),
"documentSizeBytes" integer,
"badgeUrl" character varying(500),
"credentialUrl" character varying(500),
"isVerified" boolean DEFAULT false NOT NULL,
"isPublished" boolean DEFAULT true NOT NULL,
"sortOrder" integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.documents (
id uuid NOT NULL,
"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
title character varying(220) NOT NULL,
description text,
domain public.documents_domain_enum
DEFAULT 'Other'::public.documents_domain_enum NOT NULL,
"fileType" public.documents_filetype_enum NOT NULL,
"fileUrl" character varying(500) NOT NULL,
"fileName" character varying(220) NOT NULL,
"fileSizeBytes" integer DEFAULT 0 NOT NULL,
"mimeType" character varying(120),
topic character varying(120),
"uploadedAt" timestamp with time zone DEFAULT now() NOT NULL,
"isPublished" boolean DEFAULT true NOT NULL,
"sortOrder" integer DEFAULT 0 NOT NULL,
"downloadCount" integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.inquiries (
id uuid NOT NULL,
"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
name character varying(120) NOT NULL,
email character varying(180) NOT NULL,
subject character varying(200),
message text NOT NULL,
"isRead" boolean DEFAULT false NOT NULL,
status public.inquiries_status_enum
DEFAULT 'new'::public.inquiries_status_enum NOT NULL,
"ipAddress" character varying(64),
"userAgent" character varying(300),
"readAt" timestamp with time zone
);

CREATE TABLE public.profile (
id uuid NOT NULL,
"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
name character varying(120)
DEFAULT 'Aathif Thahir'::character varying NOT NULL,
title character varying(160)
DEFAULT 'Software Engineer'::character varying NOT NULL,
headline character varying(300),
bio text,
"avatarUrl" character varying(500),
"yearsExperience" character varying(20)
DEFAULT '2.5+'::character varying NOT NULL,
"projectsCompleted" integer DEFAULT 0 NOT NULL,
"happyClients" integer DEFAULT 0 NOT NULL,
"awardsWon" integer DEFAULT 0 NOT NULL,
email character varying(180)
DEFAULT 'aathifinfo116@gmail.com'::character varying NOT NULL,
phone character varying(40),
location character varying(160),
"socialLinks" jsonb DEFAULT '[]'::jsonb NOT NULL,
"resumeUrl" character varying(500),
"resumeFileName" character varying(200)
DEFAULT 'Aathif_Thahir_Resume.pdf'::character varying NOT NULL,
"isAvailableForHire" boolean DEFAULT true NOT NULL,
"availabilityNote" character varying(200)
);

CREATE TABLE public.projects (
id uuid NOT NULL,
"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
title character varying(160) NOT NULL,
subtitle character varying(200),
category public.projects_category_enum
DEFAULT 'Other'::public.projects_category_enum NOT NULL,
description text NOT NULL,
problem text,
solution text,
impact text,
"techStack" text DEFAULT ''::text NOT NULL,
"githubUrl" character varying(500),
"liveUrl" character varying(500),
"imageUrl" character varying(500),
"isFeatured" boolean DEFAULT false NOT NULL,
"isPublished" boolean DEFAULT true NOT NULL,
"sortOrder" integer DEFAULT 0 NOT NULL,
"completedOn" character varying(40)
);

CREATE TABLE public.service_offerings (
id uuid NOT NULL,
"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
title character varying(160) NOT NULL,
description text NOT NULL,
"iconName" character varying(60)
DEFAULT 'Sparkles'::character varying NOT NULL,
"accentGradient" character varying(120),
"techTags" text DEFAULT ''::text NOT NULL,
"isPublished" boolean DEFAULT true NOT NULL,
"sortOrder" integer DEFAULT 0 NOT NULL
);

-- ############ Primary Keys ############

ALTER TABLE ONLY public.admin_users
ADD CONSTRAINT "PK_admin_users" PRIMARY KEY (id);

ALTER TABLE ONLY public.awards
ADD CONSTRAINT "PK_awards" PRIMARY KEY (id);

ALTER TABLE ONLY public.certifications
ADD CONSTRAINT "PK_certifications" PRIMARY KEY (id);

ALTER TABLE ONLY public.documents
ADD CONSTRAINT "PK_documents" PRIMARY KEY (id);

ALTER TABLE ONLY public.inquiries
ADD CONSTRAINT "PK_inquiries" PRIMARY KEY (id);

ALTER TABLE ONLY public.profile
ADD CONSTRAINT "PK_profile" PRIMARY KEY (id);

ALTER TABLE ONLY public.projects
ADD CONSTRAINT "PK_projects" PRIMARY KEY (id);

ALTER TABLE ONLY public.service_offerings
ADD CONSTRAINT "PK_service_offerings" PRIMARY KEY (id);








-- ##################################################################################################################


-- admin_users: 1 row(s)
INSERT INTO `admin_users` (`id`, `createdAt`, `updatedAt`, `email`, `passwordHash`, `displayName`, `isActive`, `lastLoginAt`) VALUES
  ('3f4b59d6-c998-4a03-b1fc-9e4a1674e4d3', '2026-08-25 21:02:27.513963', '2026-08-26 17:12:13.451272', 'aathifinfo116@gmail.com', '$2a$12$58aw1Dk5WZ5.4EGBLlHI1OzWZBmldg6vpDZDo36f4unyqbv8PFyHC', 'Aathif Thahir', 1, '2026-08-26 17:12:13.448');

-- awards: 3 row(s)
INSERT INTO `awards` (`id`, `createdAt`, `updatedAt`, `title`, `issuer`, `year`, `description`, `iconName`, `imageUrl`, `isPublished`, `sortOrder`) VALUES
  ('2b34a6a1-2163-4d26-a5be-7d8561eb21c9', '2026-08-25 21:02:27.573606', '2026-08-25 21:02:27.573606', 'Dean''s List', 'Sri Lanka Institute of Information Technology (SLIIT)', 2022, 'Placed on the faculty Dean''s List for academic excellence.', 'GraduationCap', NULL, 1, 3),
  ('65ef56d5-3a33-4fed-a0e3-75fe7aed690f', '2026-08-25 21:02:27.573606', '2026-08-26 17:23:38.862651', 'Best Developer of the 2nd Quarter', 'Allianz Insurance Lanka', 2025, 'Recognised for sustained delivery quality and technical contribution across the claims integration workstream.', 'Trophy', 'http://localhost:4000/static/images/awards/d27710d7-9253-4c98-8eab-1941dfa05f86.jpg', 1, 1),
  ('53ea2e0f-90b4-4994-b43a-bcd59033060f', '2026-08-25 21:02:27.573606', '2026-08-26 17:23:47.796478', 'Rising Star of the Year', 'Allianz Insurance Lanka', 2024, 'Awarded to the standout early-career engineer for impact and growth across the year.', 'Star', 'http://localhost:4000/static/images/awards/ddf6b456-4ae1-4f96-ae5c-416138202b6d.jpg', 1, 2);

-- certifications: 4 row(s)
INSERT INTO `certifications` (`id`, `createdAt`, `updatedAt`, `title`, `institution`, `category`, `description`, `issuedOn`, `issuedYear`, `documentUrl`, `documentName`, `documentSizeBytes`, `badgeUrl`, `credentialUrl`, `isVerified`, `isPublished`, `sortOrder`) VALUES
  ('ab2290f9-7a7d-4118-8987-e6a110f2574d', '2026-08-25 21:02:27.565653', '2026-08-25 21:02:27.565653', 'BSc (Hons) in Information Technology, Specialising in Software Engineering', 'Sri Lanka Institute of Information Technology (SLIIT)', 'Academic Degree', 'Four-year honours degree covering software engineering, distributed systems, databases, and software architecture.', '2019 - 2023', 2023, NULL, NULL, NULL, NULL, NULL, 1, 1, 1),
  ('c85f8a82-afe8-4230-818e-1340bcd6c5b3', '2026-08-25 21:02:27.565653', '2026-08-25 21:02:27.565653', 'Dean''s List Award', 'Sri Lanka Institute of Information Technology (SLIIT)', 'Academic Degree', 'Awarded for outstanding academic performance during the academic year.', '2022', 2022, NULL, NULL, NULL, NULL, NULL, 1, 1, 2),
  ('ff44bb34-ead0-469e-9fab-3e154fa841de', '2026-08-26 06:59:11.192239', '2026-08-26 06:59:11.192239', 'Oracle Certified Associate, Java SE Programmer', 'Oracle', 'Certification', 'Core Java proficiency: OOP design, collections, generics and exception handling.', '2023', 2023, NULL, NULL, NULL, NULL, NULL, 0, 1, 4),
  ('26d44640-a1e7-498d-b625-c689f4be78fc', '2026-08-26 06:59:11.084222', '2026-08-26 06:59:11.084222', 'Software Engineer - Professional Experience', 'Allianz Insurance Lanka', 'Professional', 'Backend and integration engineering across claims and policy platforms.', '2023 - Present', 2023, 'https://s3.amazonaws.com/coursera_assets/meta_images/generated/CERTIFICATE_LANDING_PAGE/CERTIFICATE_LANDING_PAGE~NK6WG8IGC4HY/CERTIFICATE_LANDING_PAGE~NK6WG8IGC4HY.jpeg', NULL, NULL, NULL, 'https://www.coursera.org/account/accomplishments/verify/NK6WG8IGC4HY', 1, 1, 3);

-- documents: 25 row(s)
INSERT INTO `documents` (`id`, `createdAt`, `updatedAt`, `title`, `description`, `domain`, `fileType`, `fileUrl`, `fileName`, `fileSizeBytes`, `mimeType`, `topic`, `uploadedAt`, `isPublished`, `sortOrder`, `downloadCount`) VALUES
  ('51ab96ba-d324-415a-81e5-f87f97a4f373', '2026-08-26 11:34:38.664392', '2026-08-26 11:46:25.859706', 'Azure Fundamentals Security Governance Availability Scalability Reliability', NULL, 'Cloud', 'docx', 'http://localhost:4000/static/documents/cloud/2.%20Azure_Fundamentals_Security_Governance_Availability_Scalability_Reliability.docx', '2. Azure_Fundamentals_Security_Governance_Availability_Scalability_Reliability.docx', 47723, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Cloud', '2026-08-26 09:25:22.748', 1, 2, 1),
  ('4a12c70c-7a91-45b6-ae6a-5cc3d2a3a6fb', '2026-08-26 11:34:38.508525', '2026-08-26 11:34:38.508525', 'Data Analytics', NULL, 'AI', 'pdf', 'http://localhost:4000/static/documents/ai/Data%20Analytics.pdf', 'Data Analytics.pdf', 794496, 'application/pdf', 'AI', '2024-02-12 16:39:55', 1, 0, 0),
  ('a74c0255-c91e-4f90-b36b-b2ed77d75a16', '2026-08-26 11:34:38.660759', '2026-08-26 11:34:38.660759', 'Azure Fundamentals Governance Compliance Cost and Monitoring', NULL, 'Cloud', 'docx', 'http://localhost:4000/static/documents/cloud/10.%20Azure_Fundamentals_Governance_Compliance_Cost_and_Monitoring.docx', '10. Azure_Fundamentals_Governance_Compliance_Cost_and_Monitoring.docx', 48927, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Cloud', '2026-08-26 09:25:15.766', 1, 10, 0),
  ('02ee5585-22e8-4807-a753-153f124b9764', '2026-08-26 11:34:38.668962', '2026-08-26 11:34:38.668962', 'Azure Fundamentals Consumption Based Model Cloud Pricing and Applied Scenarios', NULL, 'Cloud', 'docx', 'http://localhost:4000/static/documents/cloud/3.%20Azure_Fundamentals_Consumption_Based_Model_Cloud_Pricing_and_Applied_Scenarios.docx', '3. Azure_Fundamentals_Consumption_Based_Model_Cloud_Pricing_and_Applied_Scenarios.docx', 51952, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Cloud', '2026-08-26 09:25:40.898', 1, 3, 0),
  ('ecc5b4d0-1886-40f1-b892-dd99930db80a', '2026-08-26 11:34:38.672893', '2026-08-26 11:34:38.672893', 'Azure Fundamentals IaaS PaaS SaaS and Shared Responsibility', NULL, 'Cloud', 'docx', 'http://localhost:4000/static/documents/cloud/4.%20Azure_Fundamentals_IaaS_PaaS_SaaS_and_Shared_Responsibility.docx', '4. Azure_Fundamentals_IaaS_PaaS_SaaS_and_Shared_Responsibility.docx', 47674, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Cloud', '2026-08-26 09:25:10.834', 1, 4, 0),
  ('d94a832e-4384-4079-ab83-a9fcbf581a0c', '2026-08-26 11:34:38.676454', '2026-08-26 11:34:38.676454', 'Azure Fundamentals Global Infrastructure and Resource Organization', NULL, 'Cloud', 'docx', 'http://localhost:4000/static/documents/cloud/5.%20Azure_Fundamentals_Global_Infrastructure_and_Resource_Organization.docx', '5. Azure_Fundamentals_Global_Infrastructure_and_Resource_Organization.docx', 46795, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Cloud', '2026-08-26 09:25:26.75', 1, 5, 0),
  ('b2a652f6-a147-41fa-83b0-3cf22da351c4', '2026-08-26 11:34:38.680249', '2026-08-26 11:34:38.680249', 'Azure Fundamentals Compute Serverless Containers and Management Tools', NULL, 'Cloud', 'docx', 'http://localhost:4000/static/documents/cloud/6.%20Azure_Fundamentals_Compute_Serverless_Containers_and_Management_Tools.docx', '6. Azure_Fundamentals_Compute_Serverless_Containers_and_Management_Tools.docx', 45791, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Cloud', '2026-08-26 09:25:44.352', 1, 6, 0),
  ('6385bb4b-848c-47fb-b9b9-07d68e29695c', '2026-08-26 11:34:38.683467', '2026-08-26 11:34:38.683467', 'Azure Fundamentals Virtual Networking and Secure Connectivity', NULL, 'Cloud', 'docx', 'http://localhost:4000/static/documents/cloud/7.%20Azure_Fundamentals_Virtual_Networking_and_Secure_Connectivity.docx', '7. Azure_Fundamentals_Virtual_Networking_and_Secure_Connectivity.docx', 45327, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Cloud', '2026-08-26 09:25:19.353', 1, 7, 0),
  ('ec60762c-cc1b-4718-8324-dcd240a6c19a', '2026-08-26 11:34:38.688577', '2026-08-26 11:34:38.688577', 'Azure Fundamentals Storage Data Protection and Migration', NULL, 'Cloud', 'docx', 'http://localhost:4000/static/documents/cloud/8.%20Azure_Fundamentals_Storage_Data_Protection_and_Migration.docx', '8. Azure_Fundamentals_Storage_Data_Protection_and_Migration.docx', 48767, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Cloud', '2026-08-26 09:25:36.257', 1, 8, 0),
  ('c8cb0cd4-0d1b-486d-aceb-97a11e89aad4', '2026-08-26 11:34:38.691958', '2026-08-26 11:34:38.691958', 'Azure Fundamentals Identity Access and Security', NULL, 'Cloud', 'docx', 'http://localhost:4000/static/documents/cloud/9.%20Azure_Fundamentals_Identity_Access_and_Security.docx', '9. Azure_Fundamentals_Identity_Access_and_Security.docx', 49349, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Cloud', '2026-08-26 09:25:32.884', 1, 9, 0),
  ('72363d28-d1c6-4d11-83cd-7bb85375d664', '2026-08-26 11:34:38.694994', '2026-08-26 11:34:38.694994', 'JAVA Notes basic', NULL, 'Development', 'pdf', 'http://localhost:4000/static/documents/development/JAVA%20Notes%20basic.pdf', 'JAVA Notes basic.pdf', 711697, 'application/pdf', 'Development', '2025-08-03 01:36:38.143', 1, 0, 0),
  ('b5c9845f-f9d5-4049-9dd8-02ee49bd9fc6', '2026-08-26 11:34:38.697754', '2026-08-26 11:34:38.697754', 'Nest JS Note New', NULL, 'Development', 'pdf', 'http://localhost:4000/static/documents/development/Nest%20JS%20Note%20New.pdf', 'Nest JS Note New.pdf', 933119, 'application/pdf', 'Development', '2025-12-16 18:15:03.325', 1, 0, 0),
  ('328207b7-142d-4221-ada9-d1507d60b1d0', '2026-08-26 11:34:38.700537', '2026-08-26 11:34:38.700537', 'Open Source Identity and Access Management', NULL, 'Development', 'pdf', 'http://localhost:4000/static/documents/development/Open%20Source%20Identity%20and%20Access%20Management.pdf', 'Open Source Identity and Access Management.pdf', 135508, 'application/pdf', 'Development', '2025-07-06 16:46:49.732', 1, 0, 0),
  ('8a057a10-b27c-40b5-9a40-639d720503ef', '2026-08-26 11:34:38.709319', '2026-08-26 11:34:38.709319', 'SPRING AND SPRING BOOT GUIDE', NULL, 'Development', 'pdf', 'http://localhost:4000/static/documents/development/SPRING%20AND%20SPRING%20BOOT%20GUIDE.pdf', 'SPRING AND SPRING BOOT GUIDE.pdf', 4216547, 'application/pdf', 'Development', '2025-07-12 18:42:31.691', 1, 0, 0),
  ('1eab5e09-5d59-4b0c-909e-9d449fb71fd0', '2026-08-26 11:34:38.71559', '2026-08-26 11:34:38.71559', 'Spring Security Basic Architecture Explained', NULL, 'Development', 'docx', 'http://localhost:4000/static/documents/development/Spring%20Security%20Basic%20Architecture%20Explained.docx', 'Spring Security Basic Architecture Explained.docx', 697241, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Development', '2025-11-03 06:24:49.302', 1, 0, 0),
  ('cd6eb1f2-075f-4601-9f55-dbabcdf9f32c', '2026-08-26 11:34:38.730594', '2026-08-26 11:34:38.730594', 'sql cheat sheet', NULL, 'Management', 'pdf', 'http://localhost:4000/static/documents/management/sql_cheat_sheet%20.pdf', 'sql_cheat_sheet .pdf', 458245, 'application/pdf', 'Management', '2024-01-21 03:26:49', 1, 0, 0),
  ('20106175-dc75-4847-82e0-fab4c0bcf339', '2026-08-26 11:34:38.718274', '2026-08-26 11:58:16.128959', 'Spring Security', NULL, 'Development', 'docx', 'http://localhost:4000/static/documents/development/Spring%20Security.docx', 'Spring Security.docx', 264402, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Development', '2025-11-03 13:42:26.18', 1, 0, 1),
  ('a743ea65-4624-4ad8-bdf7-85ee77bb3998', '2026-08-26 11:34:38.732955', '2026-08-26 17:49:31.386054', 'sample other document', NULL, 'Other', 'pptx', 'http://localhost:4000/static/documents/other/sample_other_document.pptx', 'sample_other_document.pptx', 0, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'Other', '2026-08-26 09:30:03.352', 1, 0, 3),
  ('dd5de676-364f-415a-8b14-f68b42c1b625', '2026-08-26 11:34:38.725577', '2026-08-26 17:29:42.129249', 'devops commands cheat sheet', NULL, 'DevOps', 'pdf', 'http://localhost:4000/static/documents/devops/devops_commands_cheat_sheet.pdf', 'devops_commands_cheat_sheet.pdf', 5606845, 'application/pdf', 'DevOps', '2026-01-20 01:16:11.287', 1, 0, 9),
  ('1a97313c-36bb-48ef-a666-e66585941bd4', '2026-08-26 11:34:38.735263', '2026-08-26 18:02:03.768369', 'sample research document', NULL, 'Research', 'pptx', 'http://localhost:4000/static/documents/research/sample_research_document.pptx', 'sample_research_document.pptx', 0, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'Research', '2026-08-26 09:30:27.883', 1, 0, 5),
  ('d1678eea-017c-441c-b0b4-983248421836', '2026-08-26 13:40:05.890987', '2026-08-26 13:40:31.049035', 'New Document', 'Hello new devops dovumet', 'DevOps', 'docx', 'http://localhost:4000/static/documents/devops/Cover_Letter_Software_Engineer_Aathif_Thahir.docx', 'Cover_Letter_Software_Engineer_Aathif_Thahir.docx', 28643, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'DevOps', '2026-08-26 13:40:05.888', 1, 1, 1),
  ('de427ef0-48be-40a7-8c23-70b2817216d8', '2026-08-26 11:34:38.712393', '2026-08-26 18:02:10.752093', 'Spring Boot', NULL, 'Development', 'pdf', 'http://localhost:4000/static/documents/development/Spring%20Boot.pdf', 'Spring Boot.pdf', 2826257, 'application/pdf', 'Development', '2026-01-15 10:59:29.579', 1, 0, 54),
  ('06335f9f-b875-4c30-8852-c43ceea328e0', '2026-08-26 11:34:38.703289', '2026-08-26 17:51:41.642373', 'Servlet, proxy, load balancer', NULL, 'Development', 'docx', 'http://localhost:4000/static/documents/development/Servlet%2C%20proxy%2C%20load%20balancer.docx', 'Servlet, proxy, load balancer.docx', 296485, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Development', '2025-11-10 00:42:21.289', 1, 0, 6),
  ('4c35dd47-f79f-4b7f-9078-d9652af51e34', '2026-08-26 17:26:40.258473', '2026-08-26 17:26:40.258473', 'Test Research', 'Test Research Description', 'Research', 'docx', 'http://localhost:4000/static/documents/research/GraphQL_Guide.docx', 'GraphQL_Guide.docx', 39023, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Test Research Topic', '2026-08-26 17:26:40.255', 1, 1, 0),
  ('3d07cf1d-ca85-4359-8b71-2a9357e3b0e2', '2026-08-26 11:34:38.728075', '2026-08-26 17:51:46.703198', 'Shell Scripting for DevOps', NULL, 'DevOps', 'pdf', 'http://localhost:4000/static/documents/devops/Shell%20Scripting%20for%20DevOps.pdf', 'Shell Scripting for DevOps.pdf', 1601930, 'application/pdf', 'DevOps', '2026-01-20 01:29:35.813', 1, 0, 44);

-- inquiries: 1 row(s)
INSERT INTO `inquiries` (`id`, `createdAt`, `updatedAt`, `name`, `email`, `subject`, `message`, `isRead`, `status`, `ipAddress`, `userAgent`, `readAt`) VALUES
  ('6da3e901-51f2-4b3e-a4bf-cf7edd7de4a3', '2026-08-26 12:28:31.720063', '2026-08-26 12:28:31.720063', 'Aathif Thahir', 'aathifinfo115@gmail.com', 'Test My Porfolio Mail', '121313jlkdsjdljldj', 0, 'new', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', NULL);

-- profile: 1 row(s)
INSERT INTO `profile` (`id`, `createdAt`, `updatedAt`, `name`, `title`, `headline`, `bio`, `avatarUrl`, `yearsExperience`, `projectsCompleted`, `happyClients`, `awardsWon`, `email`, `phone`, `location`, `socialLinks`, `resumeUrl`, `resumeFileName`, `isAvailableForHire`, `availabilityNote`) VALUES
  ('e8c92924-1150-4ed2-b94e-f735ef7bbea0', '2026-08-25 21:02:27.535142', '2026-08-26 18:08:09.864423', 'Aathif Thahir', 'Software Engineer', 'I Build Scalable Microservices & Modern Web Applications', 'Results-driven Software Engineer with 3+ years of experience in backend microservices, Java, Spring Boot, NestJS, and React.js.', 'http://localhost:4000/static/images/avatar/profile-picture-avatar-1.jpg', '3+', 20, 12, 3, 'aathifinfo116@gmail.com', '+94 77 1281946', 'Colombo, Sri Lanka', '[{"url": "https://www.linkedin.com/in/aathif-thahir/", "icon": "Linkedin", "platform": "LinkedIn"}, {"url": "https://github.com/AathifInfo", "icon": "Github", "platform": "GitHub"}]', 'http://localhost:4000/static/resume/Aathif%20Thahir%20-%20Software%20Engineer%20Resume.pdf', 'Aathif Thahir - Software Engineer Resume.pdf', 1, 'Let''s build something amazing together!');

-- projects: 4 row(s)
INSERT INTO `projects` (`id`, `createdAt`, `updatedAt`, `title`, `subtitle`, `category`, `description`, `problem`, `solution`, `impact`, `techStack`, `githubUrl`, `liveUrl`, `imageUrl`, `isFeatured`, `isPublished`, `sortOrder`, `completedOn`) VALUES
  ('0204f3cd-1f62-4d3e-8e14-9d215dc3e6a3', '2026-08-25 21:02:27.554812', '2026-08-26 17:04:33.215915', 'Claims Integration System', 'Allianz Insurance - Enterprise Integration', 'Microservices', 'A microservice layer connecting the core claims platform with external partner systems, standardising claim intake and settlement flows.', 'Claims data arrived from multiple partner systems in incompatible formats, forcing manual reconciliation and slowing settlement.', 'Built a Spring Boot integration service with a canonical claim model, adapter-per-partner mapping, retry with backoff, and full audit logging.', 'Cut manual reconciliation effort substantially and gave operations end-to-end traceability on every claim.', 'Java,Spring Boot,REST,Oracle,Docker,GitHub', NULL, NULL, '/static/images/featuredproject/Claims%20Integration%20System.jpg', 1, 1, 1, NULL),
  ('a84b55a0-a019-4f7c-a931-7b30be393d84', '2026-08-25 21:02:27.554812', '2026-08-26 12:21:10.790927', 'Bulk Policy Processing System', 'Allianz Insurance - Batch Processing', 'Microservices', 'High-throughput batch pipeline for issuing and updating policies in bulk, with validation and per-record error reporting.', 'Bulk policy uploads were processed serially and failed as a whole batch, so one bad row could block thousands of valid policies.', 'Introduced chunked processing with per-record validation, isolated failure handling, and a downloadable error report for operators.', 'Large uploads complete reliably, and failed records are corrected individually instead of re-running the entire batch.', 'Java,Spring Batch,PostgreSQL,Kafka', NULL, NULL, '/static/images/featuredproject/Bulk%20Policy%20Processing%20System.jpg', 1, 1, 2, NULL),
  ('d344ea5a-3743-4fd6-8723-a66e21df0926', '2026-08-25 21:02:27.554812', '2026-08-26 12:21:10.792135', 'E-Travel & Hotelier System', 'Travel Booking Platform', 'Full-Stack', 'Booking platform covering hotel inventory, availability search, and reservation management for travellers and hoteliers.', 'Hoteliers had no single place to manage inventory, and travellers could not see live availability.', 'Built a full-stack application with a role-separated hotelier dashboard, availability search, and a reservation lifecycle with confirmations.', 'Gave both sides one system for booking and inventory, removing back-and-forth over email.', 'React,Node.js,MySQL,Express', NULL, NULL, '/static/images/featuredproject/E-Travel%20%26%20Hotelier%20System.jpg', 1, 1, 3, NULL),
  ('d73fd18d-f21c-4045-bb02-0eb7680600ce', '2026-08-25 21:02:27.554812', '2026-08-26 12:21:10.7935', 'Customer Inquiry System', 'Support Workflow Automation', 'Full-Stack', 'Inquiry intake and routing tool that assigns incoming customer questions to the right team and tracks them to resolution.', 'Inquiries arrived through scattered channels with no ownership, so responses were slow and inconsistent.', 'Centralised intake with rule-based routing, status tracking, and SLA visibility for supervisors.', 'Every inquiry now has a clear owner and status, making response times measurable for the first time.', 'Spring Boot,React,PostgreSQL,Docker', NULL, NULL, '/static/images/featuredproject/Customer%20Inquiry%20System.jpg', 1, 1, 4, NULL);

-- service_offerings: 4 row(s)
INSERT INTO `service_offerings` (`id`, `createdAt`, `updatedAt`, `title`, `description`, `iconName`, `accentGradient`, `techTags`, `isPublished`, `sortOrder`) VALUES
  ('119ef7d1-0323-4bb8-bfa8-32a1e99dfbae', '2026-08-25 21:02:27.542747', '2026-08-25 21:02:27.542747', 'Microservices Architecture', 'Designing and building resilient, independently deployable services with clean domain boundaries, async messaging, and fault tolerance.', 'Boxes', 'from-purple-500 to-indigo-500', 'Java,Spring Boot,Kafka,REST,Docker', 1, 1),
  ('6c87881a-3d91-476e-9b5e-237d94c54c09', '2026-08-25 21:02:27.542747', '2026-08-25 21:02:27.542747', 'Full-Stack Development', 'End-to-end product delivery with NestJS and React - typed APIs, clean state management, and interfaces that stay fast as they grow.', 'Layers', 'from-fuchsia-500 to-purple-500', 'NestJS,React,TypeScript,Tailwind CSS', 1, 2),
  ('1d4a8227-3a83-474e-b8dd-43a133bc3c04', '2026-08-25 21:02:27.542747', '2026-08-25 21:02:27.542747', 'Cloud & DevOps Integration', 'Containerised deployments, CI/CD pipelines, and observability so releases are routine rather than risky.', 'Cloud', 'from-blue-500 to-cyan-500', 'Docker,Kubernetes,CI/CD,Azure', 1, 3),
  ('a1a23065-5c12-4caf-890c-d574c12f9a5a', '2026-08-25 21:02:27.542747', '2026-08-25 21:02:27.542747', 'Database Design & ER Modelling', 'Normalised schemas, considered indexing, and migration strategies that keep query performance predictable at scale.', 'Database', 'from-emerald-500 to-teal-500', 'PostgreSQL,Oracle,TypeORM,JPA', 1, 4);

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;