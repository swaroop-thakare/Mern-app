"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, Upload, FileType, CheckCircle2, FileUp } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

// API base URL
const API_URL = "http://localhost:5001/api"

interface ListUploadProps {
  onUploadSuccess?: () => void
}

export default function ListUpload({ onUploadSuccess }: ListUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase()

      if (fileExtension === "csv" || fileExtension === "xlsx" || fileExtension === "xls") {
        setFile(selectedFile)
        setUploadStatus(null)
        setUploadProgress(0)
      } else {
        setFile(null)
        toast({
          title: "Invalid file format",
          description: "Please upload a CSV, XLSX, or XLS file",
          variant: "destructive",
        })
      }
    }
  }

  const simulateProgress = () => {
    // Simulate upload progress
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 10
      if (progress > 95) {
        clearInterval(interval)
        progress = 95 // Hold at 95% until the actual upload completes
      }
      setUploadProgress(Math.min(progress, 95))
    }, 200)

    return interval
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadStatus(null)
    setUploadProgress(0)

    // Start progress simulation
    const progressInterval = simulateProgress()

    const formData = new FormData()
    formData.append("file", file)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/lists/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()

      if (response.ok) {
        setUploadStatus({
          success: true,
          message: `File uploaded successfully. ${data.totalRecords} records processed.`,
        })
        setFile(null)
        // Reset the file input
        const fileInput = document.getElementById("file-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""

        if (onUploadSuccess) {
          onUploadSuccess()
        }
      } else {
        setUploadStatus({
          success: false,
          message: data.message || "Failed to upload file",
        })
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      setUploadStatus({
        success: false,
        message: "An error occurred while uploading the file",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Upload Contact Lists</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border border-dashed bg-slate-50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-4 bg-white p-4 rounded-full shadow-sm">
                <FileUp className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">Upload Your File</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Drag and drop your CSV or Excel file here, or click to browse
              </p>

              <div className="w-full">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>

              {file && (
                <div className="mt-4 w-full">
                  <div className="flex items-center p-3 bg-white rounded-md border">
                    <FileType className="h-5 w-5 text-slate-400 mr-3" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="mt-6 w-full bg-slate-800 hover:bg-slate-700"
              >
                {isUploading ? (
                  <>
                    <span className="mr-2">Uploading...</span>
                    {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload and Distribute
                  </>
                )}
              </Button>

              {isUploading && (
                <div className="w-full mt-4">
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {uploadStatus && (
            <Alert variant={uploadStatus.success ? "default" : "destructive"} className="mb-6">
              {uploadStatus.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle className={uploadStatus.success ? "text-green-600" : ""}>
                {uploadStatus.success ? "Upload Successful" : "Upload Failed"}
              </AlertTitle>
              <AlertDescription>{uploadStatus.message}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-slate-800 mb-4">File Format Requirements</h3>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Your file should contain the following columns:</p>
                <div className="bg-slate-50 p-4 rounded-md border">
                  <ul className="list-disc list-inside text-sm space-y-3">
                    <li className="text-slate-700">
                      <span className="font-medium">FirstName</span> - Text field for contact's first name
                    </li>
                    <li className="text-slate-700">
                      <span className="font-medium">Phone</span> - Number field for contact's phone number
                    </li>
                    <li className="text-slate-700">
                      <span className="font-medium">Notes</span> - Text field for additional information
                    </li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Distribution Logic</h4>
                  <p className="text-sm text-blue-700">
                    The system will automatically distribute the contacts equally among all agents. If the number of
                    contacts is not divisible by the number of agents, the remaining contacts will be distributed one by
                    one to agents in sequence.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
