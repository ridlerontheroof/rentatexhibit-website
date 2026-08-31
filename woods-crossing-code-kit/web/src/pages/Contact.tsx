import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { trackLead } from "../lib/analytics";
import { getVisitSource } from "../lib/visitSource";

const formSchema = z.object({
  type: z.enum(["contact", "tour", "apply"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  message: z.string().optional(),
  xh_note: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function Contact() {
  const [success, setSuccess] = useState(false);
  const [firstInputTime, setFirstInputTime] = useState<number | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "contact",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      message: "",
      xh_note: "",
    },
  });

  const handleInput = () => {
    if (!firstInputTime) {
      setFirstInputTime(Date.now());
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const elapsedMs = firstInputTime ? Date.now() - firstInputTime : undefined;
      const payload = {
        ...data,
        source: getVisitSource(),
        ...(elapsedMs !== undefined ? { elapsedMs } : {})
      };

      const res = await fetch(`${apiBase}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit");
      return res.json();
    },
    onSuccess: (_, variables) => {
      setSuccess(true);
      form.reset();
      setFirstInputTime(null);
      trackLead(variables.type);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="py-24 px-4 md:px-8 max-w-4xl mx-auto w-full">
      <header className="mb-16">
        <h1 className="text-4xl md:text-6xl font-serif tracking-tight mb-6">Contact Us</h1>
        <p className="text-xl text-muted-foreground">
          We would love to hear from you. Schedule a tour or reach out with any questions.
        </p>
      </header>

      {success ? (
        <div className="p-12 border bg-primary/5 text-center rounded-sm">
          <h2 className="text-2xl font-serif text-primary mb-4">Thank You</h2>
          <p className="text-muted-foreground">
            Your inquiry has been received. A member of our leasing team will be in touch shortly.
          </p>
          <Button onClick={() => setSuccess(false)} variant="outline" className="mt-8">
            Send Another Message
          </Button>
        </div>
      ) : (
        <form action={`${apiBase}/api/leads`} method="POST" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" onInput={handleInput}>
          {/* Honeypot field */}
          <div
            style={{ position: 'fixed', left: '-10000px', top: 0, width: '1px', height: '1px', overflow: 'hidden' }}
            aria-hidden="true"
          >
            <input
              id="xh_note"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-label="Do not fill"
              style={{ width: '1px', height: '1px' }}
              {...form.register("xh_note")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...form.register("firstName")} data-testid="input-first-name" />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...form.register("lastName")} data-testid="input-last-name" />
              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} data-testid="input-email" />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...form.register("phone")} data-testid="input-phone" />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="type">Inquiry Type</Label>
            <select
              id="type"
              className="flex h-11 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              data-testid="select-inquiry-type"
              {...form.register("type")}
            >
              <option value="contact">General Inquiry</option>
              <option value="tour">Schedule a Tour</option>
              <option value="apply">Application Question</option>
            </select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea id="message" rows={5} {...form.register("message")} data-testid="input-message" />
          </div>

          <Button type="submit" size="lg" className="w-full md:w-auto" disabled={mutation.isPending} data-testid="button-submit-lead">
            {mutation.isPending ? "Sending..." : "Submit Inquiry"}
          </Button>

          {mutation.isError && (
            <p className="text-sm text-destructive">
              Something went wrong. Please try again or call us directly.
            </p>
          )}
        </form>
      )}
    </div>
  );
}