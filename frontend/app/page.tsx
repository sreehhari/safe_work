"use client"

import UploadComponent from "@/components/Upload Button/Uploadbutton";
import { redirect } from "next/navigation";

export default function Home() {
  // const session = await auth();
  // if(!session) redirect("/signin")
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
    <UploadComponent />
</div>
  );
}
