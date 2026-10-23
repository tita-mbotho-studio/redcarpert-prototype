"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import styles from "./EnquiryPreview.module.css";

const generalMessage = `Hello Redcarpert Wedding Dresses!

I would like to enquire about your wedding dresses and arrange a fitting.

Could you please provide more information?

Thank you.`;

function isWhatsAppDestination(value: string): boolean {
  if (/^(?:whatsapp:|intent:.*(?:whatsapp|com\.whatsapp))/i.test(value.trim())) return true;
  try {
    const host = new URL(value, window.location.href).hostname;
    return /(^|\.)(?:wa\.me|whatsapp\.com|whatsapp\.net)$/i.test(host);
  } catch { return false; }
}

// A future caller can supply a dress-specific message without adding a recipient.
export function EnquiryPreview({ message = generalMessage }: { message?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const titleId = useId();
  const noticeId = useId();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Neutralise real links as well as intercepting activation, so opening a link
    // via its context menu cannot bypass the preview. No destination is retained.
    const neutraliseLinks = (root: ParentNode) => {
      const links = [...root.querySelectorAll<HTMLAnchorElement>("a[href]")];
      if (root instanceof HTMLAnchorElement && root.hasAttribute("href")) links.push(root);
      for (const link of links) {
        if (!isWhatsAppDestination(link.getAttribute("href") ?? "")) continue;
        link.removeAttribute("href");
        link.removeAttribute("target");
        link.setAttribute("data-whatsapp-preview", "");
        link.setAttribute("role", "button");
        link.setAttribute("tabindex", "0");
        link.setAttribute("aria-haspopup", "dialog");
      }
    };
    neutraliseLinks(document);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes" && record.target instanceof Element) neutraliseLinks(record.target);
        for (const node of record.addedNodes) if (node instanceof Element) neutraliseLinks(node);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["href"] });

    const controlFor = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof Element)) return null;
      const control = target.closest<HTMLElement>("#ht-ctc-chat, [data-whatsapp-preview], a[href]");
      if (!control) return null;
      return control.matches("#ht-ctc-chat, [data-whatsapp-preview]") || isWhatsAppDestination(control.getAttribute("href") ?? "") ? control : null;
    };
    const open = (control: HTMLElement) => {
      if (dialog.open) return;
      triggerRef.current = control;
      setCopyStatus("");
      dialog.showModal();
    };
    const onActivate = (event: MouseEvent) => {
      const control = controlFor(event.target);
      if (!control) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.type === "click" || event.button === 1) open(control);
    };
    const onKey = (event: KeyboardEvent) => {
      if (dialog.open) {
        // Keep fullscreen theme keyboard handlers out of the modal. Explicitly
        // cycle Tab at the boundaries instead of letting it move to browser chrome.
        event.stopImmediatePropagation();
        if (event.key === "Tab") {
          const buttons = [...dialog.querySelectorAll<HTMLButtonElement>("button:not([disabled])")];
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
        if (event.key === "Escape") { event.preventDefault(); dialog.close(); }
        return;
      }
      const control = controlFor(event.target);
      if (control && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) open(control);
      }
    };
    const onClose = () => {
      if (dialog.open) return; // Ignore a queued close event after a rapid reopen.
      if (triggerRef.current?.isConnected) triggerRef.current.focus({ preventScroll: true });
      triggerRef.current = null;
    };
    const containScroll = (event: Event) => {
      if (dialog.open) event.stopImmediatePropagation();
    };
    // Window capture runs before legacy document/target/bubble handlers. Install
    // before SiteRuntime loads theme scripts; remove on every unmount/remount.
    window.addEventListener("click", onActivate, true);
    window.addEventListener("auxclick", onActivate, true);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("wheel", containScroll, { capture: true, passive: true });
    window.addEventListener("touchmove", containScroll, { capture: true, passive: true });
    dialog.addEventListener("close", onClose);
    return () => {
      observer.disconnect();
      window.removeEventListener("click", onActivate, true);
      window.removeEventListener("auxclick", onActivate, true);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("wheel", containScroll, true);
      window.removeEventListener("touchmove", containScroll, true);
      if (dialog.open) dialog.close();
      onClose();
      dialog.removeEventListener("close", onClose);
    };
  }, []);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      if (dialogRef.current?.open) setCopyStatus("Message copied.");
    } catch {
      // Clipboard permissions or insecure hosting can reject the API. Select the
      // message for manual copying rather than reporting a success that did not occur.
      const range = document.createRange();
      if (messageRef.current) {
        range.selectNodeContents(messageRef.current);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setCopyStatus("Automatic copying is unavailable. The message is selected; use your device’s Copy command.");
    }
  };

  return <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} aria-describedby={noticeId}>
    <p className={styles.demo}>Demonstration</p>
    <h2 id={titleId} className={styles.title}>WhatsApp Enquiry Preview</h2>
    <p id={noticeId} className={styles.notice}>Preview only — WhatsApp Business number not yet confirmed. No message will be sent.</p>
    <p ref={messageRef} className={styles.message}>{message}</p>
    <div className={styles.actions}>
      <button type="button" onClick={copyMessage}>Copy Message</button>
      <button type="button" onClick={() => dialogRef.current?.close()}>Close</button>
    </div>
    <p className={styles.status} role="status">{copyStatus}</p>
  </dialog>;
}
