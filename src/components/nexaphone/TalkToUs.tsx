"use client";

import { MessageSquare, Phone, MessagesSquare } from "lucide-react";
import { CONTACT_PHONE, CONTACT_TEL } from "./data";
import { useLead } from "./lead";

/** Call, text, or chat (the in-page question form) with a real person. */
export default function TalkToUs({ device, title = "Talk to a person" }: { device?: string; title?: string }) {
  const { open } = useLead();
  return (
    <div className="np-talk">
      <div className="np-talk-head">
        <strong>{title}</strong>
        <span>Questions about hardware, setup or your site? We answer.</span>
      </div>
      <div className="np-talk-btns">
        <a href={`tel:${CONTACT_TEL}`} className="np-talk-btn">
          <Phone size={18} />
          <span>Call</span>
        </a>
        <a href={`sms:${CONTACT_TEL}`} className="np-talk-btn">
          <MessageSquare size={18} />
          <span>Text</span>
        </a>
        <button type="button" className="np-talk-btn np-talk-chat" onClick={() => open("question", device)}>
          <MessagesSquare size={18} />
          <span>Chat</span>
        </button>
      </div>
      <a href={`tel:${CONTACT_TEL}`} className="np-talk-num np-num">
        {CONTACT_PHONE}
      </a>
    </div>
  );
}
