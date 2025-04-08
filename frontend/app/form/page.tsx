"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Trash2, Plus, Upload, Camera } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createSafetyReport } from "@/lib/actions"
import {toast} from "sonner"
const formSchema = z.object({
  siteName: z.string().min(2, {
    message: "Site name must be at least 2 characters.",
  }),
  siteLocation: z.string().min(5, {
    message: "Site location must be at least 5 characters.",
  }),
  // inspectorName: z.string().min(2, {
  //   message: "Inspector name must be at least 2 characters.",
  // }),
  // inspectionDate: z.string(),
  cameras: z
    .array(
      z.object({
        name: z.string().min(1, { message: "Camera name is required" }),
        // location: z.string().min(1, { message: "Camera location is required" }),
      }),
    )
    .min(1, { message: "At least one camera is required" }),
  missingHelmets: z.number().min(0).optional(),
  missingVests: z.number().min(0).optional(),
  // missingGloves: z.number().min(0).optional(),
  // missingBoots: z.number().min(0).optional(),
  // additionalNotes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function SafetyReportForm() {
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  // const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siteName: "",
      siteLocation: "",
      // inspectorName: "",
      cameras: [{ name: ""}],

  
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)

      // Call the server action to create the safety report and process files
      const result = await createSafetyReport(values, files)

      if (result.success) {
        // toast({
        //   title: "Report submitted successfully",
        //   description: `Report ID: ${result.reportId}`,
        // })
        toast("Report Submitted successfully",{
          description:`Report ID: ${result.siteId}`
        })

        // Reset the form
        form.reset()
        setFiles([])

        // Optionally redirect to a success page or report details page
        // router.push(`/reports/${result.reportId}`)
      } else {
        // toast({
        //   title: "Error submitting report",
        //   description: result.error || "An unknown error occurred",
        //   variant: "destructive",
        // })
        toast.warning("Error submitting report",{
          description:result.error || "An unknown error occurred"
        })
      }
    } catch (error) {
      // toast({
      //   title: "Error submitting report",
      //   description: (error as Error).message || "An unknown error occurred",
      //   variant: "destructive",
      // })
      toast.warning("Error submitting report",{
        description:(error as Error).message || "An unknown error occurred"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (

    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Construction Site Information</CardTitle>
            <CardDescription>Enter the details about the construction site being inspected.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="siteName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter site name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="siteLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter site location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Camera Information</CardTitle>
            <CardDescription>Enter details about the cameras used for monitoring.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {form.watch("cameras").map((_, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
                  <FormField
                    control={form.control}
                    name={`cameras.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Camera Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter camera name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* <FormField
                    control={form.control}
                    name={`cameras.${index}.location`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Camera Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter camera location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        const currentCameras = form.getValues("cameras")
                        form.setValue(
                          "cameras",
                          currentCameras.filter((_, i) => i !== index),
                        )
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Camera
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentCameras = form.getValues("cameras")
                  form.setValue("cameras", [...currentCameras, { name: "" }])
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Camera
              </Button>
            </div>
          </CardContent>
        </Card>


{/*file upload goes here*/}

        <Card>
          <CardHeader>
            <CardTitle>Upload Photos/Videos</CardTitle>
            <CardDescription>
              Upload photos or videos from the construction site for safety analysis with YOLOv8.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="media-upload">Upload Media</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="media-upload"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  <Label
                    htmlFor="media-upload"
                    className="cursor-pointer inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Browse
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">Supported formats: JPG, MP4</p>
              </div>

              {files.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Uploaded Files:</h3>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center">
                          <Camera className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

{/* file upload ends here */}

        {/* <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Add any additional observations or notes about the safety inspection.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes or observations here..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Safety Report"}
            </Button>
          </CardFooter>
        </Card> */}
                  <CardFooter>
            <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Safety Report"}
            </Button>
          </CardFooter>
      </form>
    </Form>
  
  )
}

function Label({ htmlFor, children, className }: { htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ""}`}
    >
      {children}
    </label>
  )
}

