"use client";
import { useEffect } from "react";
import { captureAttrFromPage } from "@/lib/utm";

export default function AttrCapture() {
  useEffect(() => { captureAttrFromPage(); }, []);
  return null;
}


