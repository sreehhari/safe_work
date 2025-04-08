// lib/actions.ts
"use server"

import { revalidatePath } from "next/cache"
import {prisma} from "@/prisma"
import { auth } from "@/auth"
import { promises } from "dns"
import { POST } from "@/app/api/auth/[...nextauth]/route"

interface CameraData{
  name:string
    // location:string
}

interface SafetyReportFormData{
  siteName:string
  siteLocation:string
  cameras:CameraData[]
}

export async function createSafetyReport(formData:SafetyReportFormData, files:File[]):Promise<{success:boolean;error?:string;siteId?:string}> {
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

      // Add the report ID to link the analysis results
      // formDataForAPI.append('report_id', report.id)
      
      // Add all files to the FormData
      // files.forEach((file, index) => {
      //   formDataForAPI.append(`file_${index}`, file)
      // })
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


      // // Send to FastAPI endpoint
      // const response = await fetch('https://your-fastapi-endpoint.com/analyze', {
      //   method: 'POST',
      //   body: formDataForAPI,
      // })

      // if (!response.ok) {
      //   throw new Error('Failed to process images/videos with YOLOv8')
      // }

      // Optional: Get the analysis results from the API
      // const analysisResults = await response.json()
      
      // You could update the report with the analysis results if needed
    }

    revalidatePath('/')
    return { success: true, siteId:site.id}
  } catch (error) {
    console.error('Error creating safety report:', error)
    return { success: false, error: (error as Error).message }
  }
}