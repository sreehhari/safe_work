// lib/actions.ts
"use server"

import { revalidatePath } from "next/cache"
import {prisma} from "@/prisma"
import { auth } from "@/auth"
import { promises } from "dns"
import { POST } from "@/app/api/auth/[...nextauth]/route"
import PDFDocument from 'pdfkit'
import path from "path"
import fs from 'fs'

type ReportDetails = {
  siteName: string;
  cameraPoint: string;
  date: string;
  time: string;
  helmetMissing: number;
  jacketMissing: number;
  totalMissing: number;
};
interface CameraData{
  name:string
    // location:string
}

interface SafetyReportFormData{
  siteName:string
  siteLocation:string
  cameras:CameraData[]
}

export async function createSafetyReport(formData:SafetyReportFormData, files:File[]):Promise<{success:boolean;error?:string;siteId?:string;pdfUrl?: string}> {
  try {

    const session = await auth();
    const userId = session?.user?.id
    if(!userId) throw new Error("not authenticated")
    const site = await prisma.site.create({
        data:{
            name:formData.siteName,
            location:formData.siteLocation,
            user:{connect:{id:userId}}

            
        },
    })
    const cameraData = formData.cameras.map((camera) => ({
      name: camera.name,
      // location:camera.location,
      siteId: site.id,
    }))

    if(cameraData.length>0){
      await prisma.site_point.createMany({
        data:cameraData,
        skipDuplicates:true,
      })
    }

    let pdfUrl = undefined;

    // 2. Send the files to the FastAPI endpoint for YOLOv8 processing
    if (files.length > 0) {
      const file = files[0];
      const formDataForAPI = new FormData()
      formDataForAPI.append('file',file);
      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      let endpoint ="";


      //routing based on file type

      if(fileType.startsWith("video/")|| fileName.endsWith(".mp4")||fileName.endsWith(".mov")|| fileName.endsWith(".avi")){
        endpoint="/detect/video"
      }else if(fileType.startsWith("image/")||fileName.endsWith(".jpg")||fileName.endsWith(".jpeg")||fileName.endsWith(".png")){
        endpoint="/detect/image"
      }else{
        throw new Error("Unsupported file format.Only images and videos are allowed")
      }

      const res = await fetch(`http://127.0.0.1:8000${endpoint}`,{
        method:"POST",
        body:formDataForAPI
      });

      if(!res.ok) throw new Error("failed to process file");

      const data = await res.json();
      console.log(data);

      const sitePoint = await prisma.site_point.findFirst({
        where:{
          siteId:site.id,
          name:formData.cameras[0].name,
        },
      });

      if(!sitePoint) throw new Error("no valid camera found at the site");

      const fileResults = await prisma.yolo_results.create({
        data:{
          helmets:data.helmet,
          vests:data.jacket,
          siteId:site.id,
          sitePointId:sitePoint.id,
        }
      })

      // Generate PDF
      const fontPath = path.join(process.cwd(), 'lib/fonts/Helvetica.ttf'); // Adjust to your font file name
      console.log('Font path:', fontPath); // Debug: Check the path
      if (!fs.existsSync(fontPath)) {
        throw new Error(`Font file not found at ${fontPath}`);
      }
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });
      // Test if font loading works
      doc.registerFont('CustomHelvetica', fontPath);
      doc.font('CustomHelvetica'); // Use the registered font      // Buffer to store PDF data
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      
      // PDF content
      const date = new Date();
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString();

      doc
        .fontSize(20)
        .text('🦺 SAFETY GEAR VIOLATION REPORT', { align: 'center' })
        .moveDown(2);

      doc
        .fontSize(14)
        .text(`📍 Site: ${site.name}`)
        .text(`📍 Location: ${formData.siteLocation}`)
        .text(`📹 Camera Point: ${sitePoint.name}`)
        .text(`📅 Date: ${dateStr}`)
        .text(`⏰ Time: ${timeStr}`)
        .moveDown(1);

      doc
        .text(`🚫 Helmet Missing: ${data.helmet}`)
        .text(`🚫 Jacket Missing: ${data.jacket}`)
        .moveDown(1)
        .fontSize(16)
        .text(`❗ Total Violations: ${data.helmet + data.jacket}`, { align: 'center' });

      doc.end();

      // Convert buffer to base64 for client-side download
      const pdfBuffer = Buffer.concat(buffers);
      pdfUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    }

console.log(pdfUrl)

    revalidatePath('/')
    return { success: true, siteId:site.id,pdfUrl}
  } catch (error) {
    console.error('Error creating safety report:', error)
    return { success: false, error: (error as Error).message }
  }
}