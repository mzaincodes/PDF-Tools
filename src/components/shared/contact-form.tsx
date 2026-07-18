"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/lib/site";

const schema = z.object({
  name: z.string().min(2, "Please enter your name."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(3, "Please add a subject."),
  message: z.string().min(10, "Your message should be at least 10 characters."),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const [sent, setSent] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    // No server: compose an email the user can send from their own client.
    await new Promise((r) => setTimeout(r, 700));
    const email = `hello@${siteConfig.url.replace(/^https?:\/\//, "")}`;
    const body = encodeURIComponent(`${values.message}\n\n— ${values.name} (${values.email})`);
    const subject = encodeURIComponent(values.subject);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setSent(true);
    toast.success("Your message is ready to send in your email app.");
    reset();
    setTimeout(() => setSent(false), 6000);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center rounded-2xl border bg-card p-10 text-center shadow-soft">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-success/12 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h3 className="mt-5 text-xl font-semibold">Thanks for reaching out!</h3>
        <p className="mt-2 max-w-sm text-muted-foreground">
          We've opened your email app with your message ready to send. We'll reply as soon as we can.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border bg-card p-6 shadow-soft sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Jane Doe" {...register("name")} aria-invalid={!!errors.name} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="jane@example.com" {...register("email")} aria-invalid={!!errors.email} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" placeholder="How can we help?" {...register("subject")} aria-invalid={!!errors.subject} />
        {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" rows={5} placeholder="Tell us what's on your mind…" {...register("message")} aria-invalid={!!errors.message} />
        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
      </div>
      <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Send message
      </Button>
    </form>
  );
}
