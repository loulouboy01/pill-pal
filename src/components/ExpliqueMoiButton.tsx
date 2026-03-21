import { useState, useRef, useEffect } from "react";
import { Bot, X, Pill, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ExpliqueMoiButtonProps {
  cis: string;
  nomMedicament: string;
}

const SUGGESTIONS = [
  "À quoi sert ce médicament ?",
  "Quels sont les effets secondaires ?",
  "Quelle est la posologie ?",
];

export default function ExpliqueMoiButton({ cis, nomMedicament }: ExpliqueMoiButtonProps) {
  const [open, setOpen] = useState(false);
  const [noticeText, setNoticeText] = useState<string | null>(null);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [noticeError, setNoticeError] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Fetch notice on open
  useEffect(() => {
    if (!open || noticeText || noticeLoading) return;
    setNoticeLoading(true);
    setNoticeError(false);

    supabase.functions
      .invoke("fetch-notice", { body: { cis } })
      .then(({ data, error }) => {
        if (error || !data?.noticeText) {
          setNoticeError(true);
        } else {
          setNoticeText(data.noticeText);
        }
      })
      .catch(() => setNoticeError(true))
      .finally(() => setNoticeLoading(false));
  }, [open, cis, noticeText, noticeLoading]);

  async function sendMessage(text: string) {
    if (!text.trim() || !noticeText) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-medicament", {
        body: {
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          noticeText,
          nomMedicament,
          cis,
        },
      });

      if (error || !data?.content) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Désolé, une erreur est survenue. Veuillez réessayer." },
        ]);
      } else {
        const assistantText = data.content
          .filter((b: any) => b.type === "text")
          .map((b: any) => b.text)
          .join("");
        setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Désolé, une erreur est survenue. Veuillez réessayer." },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setMessages([]);
    setNoticeText(null);
    setNoticeError(false);
  }

  if (!cis) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md"
      >
        <Bot className="mr-2 h-5 w-5" />
        Explique-moi mon médicament
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative z-10 flex w-full max-w-[32rem] flex-col rounded-2xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
            style={{ height: "min(85vh, 700px)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Pill className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{nomMedicament}</p>
                <p className="text-xs text-white/70">Assistant médicament · CIS {cis}</p>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {noticeLoading && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <p className="text-sm">Chargement de la notice du médicament…</p>
                </div>
              )}

              {noticeError && (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <p className="text-sm text-red-600 font-medium text-center">
                    Impossible de charger la notice. Vérifiez le code CIS.
                  </p>
                </div>
              )}

              {noticeText && messages.length === 0 && !isTyping && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                    <Bot className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Posez vos questions sur {nomMedicament}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                      J'ai accès à la notice complète de ce médicament. Je peux vous expliquer la posologie, les effets secondaires, les contre-indications, etc.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="rounded-2xl bg-gray-100 px-4 py-3 flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Disclaimer + Input */}
            <div className="border-t border-gray-100 px-4 pb-4 pt-2">
              <p className="mb-2 text-[10px] text-center text-muted-foreground">
                Ce chatbot ne remplace pas un avis médical. Consultez votre médecin ou pharmacien pour toute question de santé.
              </p>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                  placeholder="Posez votre question…"
                  disabled={!noticeText || isTyping}
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 transition-colors"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || !noticeText || isTyping}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-40 hover:from-blue-700 hover:to-indigo-700 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
