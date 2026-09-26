"use client";

import { useState, type FormEvent } from "react";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { editorClient } from "@/lib/clients";
import { errorMessage } from "@/lib/errors";
import { blankSurvey, slugFromTitle } from "@/lib/sample";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function NewSurveyDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const trimmed = title.trim();

  function reset(next: boolean) {
    setOpen(next);
    if (!next) {
      setTitle("");
      setError(undefined);
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || trimmed.length === 0) return;
    setPending(true);
    setError(undefined);
    try {
      const saved = await editorClient.saveSurvey({
        id: crypto.randomUUID(),
        slug: slugFromTitle(trimmed),
        draftJson: blankSurvey(trimmed),
      });
      setOpen(false);
      router.push(`/studio/${saved.id}`);
      router.refresh();
    } catch (cause) {
      setError(errorMessage(cause));
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        New survey
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New survey</DialogTitle>
          <DialogDescription>
            Starts as a draft. Nothing is published yet.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => void create(event)}
        >
          <FieldGroup>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="survey-title">Title</FieldLabel>
              <Input
                id="survey-title"
                value={title}
                autoFocus
                autoComplete="off"
                maxLength={120}
                aria-invalid={error ? true : undefined}
                onChange={(event) => setTitle(event.target.value)}
              />
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || trimmed.length === 0}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
