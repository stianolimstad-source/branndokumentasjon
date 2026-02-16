
ALTER TABLE public.qa_checkpoints ADD COLUMN review_type text NOT NULL DEFAULT 'sidemannskontroll';

-- Drop existing unique constraint if any, and add new one including review_type
CREATE UNIQUE INDEX uq_qa_checkpoint_per_review ON public.qa_checkpoints (task_id, concept_id, section_key, review_type);
