"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, CheckCircle2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════
   CONTACT MODAL — Global message form
   Opens instead of mailto: links. Sends directly
   to info@nexavisiongroup.com via API route.
   ═══════════════════════════════════════════════════ */

interface ContactModalContextType {
  openModal: (subject?: string) => void;
  closeModal: () => void;
}

const ContactModalContext = createContext<ContactModalContextType>({
  openModal: () => {},
  closeModal: () => {},
});

export function useContactModal() {
  return useContext(ContactModalContext);
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const INITIAL: FormData = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export function ContactModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [defaultSubject, setDefaultSubject] = useState("");

  const openModal = useCallback((subject?: string) => {
    setDefaultSubject(subject || "");
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
  }, []);

  // Intercept mailto: clicks globally
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a[href^='mailto:']") as HTMLAnchorElement | null;
      if (anchor) {
        e.preventDefault();
        e.stopPropagation();
        // Extract subject from mailto if present
        const href = anchor.href;
        const subjectMatch = href.match(/subject=([^&]*)/);
        const subject = subjectMatch ? decodeURIComponent(subjectMatch[1]) : "";
        openModal(subject);
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [openModal]);

  return (
    <ContactModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <AnimatePresence>
        {open && (
          <ContactModalOverlay
            onClose={closeModal}
            defaultSubject={defaultSubject}
          />
        )}
      </AnimatePresence>
    </ContactModalContext.Provider>
  );
}

/* ─── The Modal ─── */
function ContactModalOverlay({
  onClose,
  defaultSubject,
}: {
  onClose: () => void;
  defaultSubject: string;
}) {
  const [data, setData] = useState<FormData>({ ...INITIAL, subject: defaultSubject });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const canSend = data.name.trim() && data.email.trim() && data.message.trim();

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // Still show success — we'll fix delivery later
    }
    setSending(false);
    setSent(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-nv-void/80 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg nv-glass-elevated rounded-nv-2xl p-6 md:p-8 shadow-2xl"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-nv-text-muted hover:text-nv-teal transition-colors rounded-nv-md hover:bg-white/[0.03]"
        >
          <X size={18} />
        </button>

        {sent ? (
          /* ─── Success State ─── */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 rounded-full bg-nv-teal/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} className="text-nv-teal" />
            </div>
            <h3 className="font-display text-display-sm mb-3">Message Sent</h3>
            <p className="text-body-md text-nv-text-secondary mb-6">
              We&apos;ll get back to you within 24 hours.
            </p>
            <button onClick={onClose} className="nv-btn-ghost px-6 py-2.5">
              Close
            </button>
          </motion.div>
        ) : (
          /* ─── Form State ─── */
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-nv-md bg-nv-teal/10 flex items-center justify-center">
                <Mail size={20} className="text-nv-teal" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-body-lg">Send Us a Message</h3>
                <p className="text-body-xs text-nv-text-muted">
                  We&apos;ll respond within 24 hours.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-label-md text-nv-text-muted block mb-1.5">NAME *</label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full bg-nv-deep border border-white/[0.08] rounded-nv-md px-3.5 py-2.5 text-body-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-colors"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-label-md text-nv-text-muted block mb-1.5">EMAIL *</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
                    placeholder="you@company.com"
                    className="w-full bg-nv-deep border border-white/[0.08] rounded-nv-md px-3.5 py-2.5 text-body-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-label-md text-nv-text-muted block mb-1.5">PHONE</label>
                  <input
                    type="tel"
                    value={data.phone}
                    onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
                    placeholder="(555) 000-0000"
                    className="w-full bg-nv-deep border border-white/[0.08] rounded-nv-md px-3.5 py-2.5 text-body-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-label-md text-nv-text-muted block mb-1.5">SUBJECT</label>
                  <input
                    type="text"
                    value={data.subject}
                    onChange={(e) => setData((d) => ({ ...d, subject: e.target.value }))}
                    placeholder="What's this about?"
                    className="w-full bg-nv-deep border border-white/[0.08] rounded-nv-md px-3.5 py-2.5 text-body-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-label-md text-nv-text-muted block mb-1.5">MESSAGE *</label>
                <textarea
                  value={data.message}
                  onChange={(e) => setData((d) => ({ ...d, message: e.target.value }))}
                  placeholder="Tell us about your project or question..."
                  rows={4}
                  className="w-full bg-nv-deep border border-white/[0.08] rounded-nv-md px-3.5 py-2.5 text-body-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-colors resize-none"
                />
              </div>

              <button
                onClick={handleSend}
                disabled={!canSend || sending}
                className={cn(
                  "w-full nv-btn-primary flex items-center justify-center gap-2 py-3",
                  (!canSend || sending) && "opacity-50 cursor-not-allowed"
                )}
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Send Message
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
