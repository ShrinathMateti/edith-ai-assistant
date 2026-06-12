import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Messages({ messages }) {
  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto font-sans">
      {messages.map((msg, i) => {
        const isUser = msg.role === "user";

        return (
          <div
            key={i}
            className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex flex-col ${isUser ? "max-w-[75%] items-end" : "w-full items-start"} space-y-1.5`}>

              <div className="text-[11px] font-semibold text-[#b4b4b4] px-1 select-none">
                {isUser ? "You" : "Edith"}
              </div>

              <div
                className={`text-[15px] leading-relaxed transition-all duration-200 w-full ${
                  isUser
                    ? "bg-[#2f2f2f] text-[#ececec] rounded-[20px] px-4 py-2.5 shadow-sm whitespace-pre-wrap"
                    : "text-[#ececec] bg-transparent pt-1"
                }`}
              >
                {isUser ? (
                  <div className="wrap-break-word">{msg.text}</div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none
                    prose-p:leading-relaxed prose-p:mb-3 prose-p:last:mb-0
                    prose-headings:text-[#ececec] prose-headings:font-semibold prose-headings:mb-2 prose-headings:mt-4
                    prose-strong:text-[#ececec] prose-strong:font-semibold
                    prose-em:text-[#d4d4d4]
                    prose-code:text-cyan-300 prose-code:bg-[#1e2433] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-[#1e2433] prose-pre:border prose-pre:border-white/8 prose-pre:rounded-xl prose-pre:p-4
                    prose-ul:my-2 prose-ul:pl-5 prose-li:my-0.5 prose-li:marker:text-cyan-500
                    prose-ol:my-2 prose-ol:pl-5
                    prose-blockquote:border-l-cyan-500/50 prose-blockquote:text-[#b4b4b4] prose-blockquote:bg-white/2 prose-blockquote:rounded-r-lg prose-blockquote:py-1
                    prose-hr:border-white/10
                    prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
                    prose-table:text-sm prose-th:text-[#ececec] prose-td:text-[#d4d4d4]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}

                {!isUser && (
                  <div className="mt-4 flex justify-start animate-fade-in">
                    <CopyButton textToCopy={msg.text} />
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}


function CopyButton({ textToCopy }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
        copied
          ? "text-emerald-400 bg-emerald-500/8"
          : "text-[#b4b4b4] hover:text-[#ececec] hover:bg-white/4"
      }`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
}