'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, ArrowRight, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Papa from 'papaparse'
import { toast } from 'react-hot-toast'
import { useRegistrationStore } from '@/store/registration-store'

export default function AdminUploadPage() {
  const { students } = useRegistrationStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const [csvPreview, setCsvPreview] = useState<string[][]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file || !file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file.')
      return
    }
    Papa.parse<string[]>(file, {
      complete: (results) => {
        const rows = results.data as string[][]
        if (rows.length < 2) {
          toast.error('CSV file appears empty.')
          return
        }
        // Basic column validation (look for Matric No and Name)
        const headers = rows[0].map(h => h.trim().toLowerCase())
        const hasMatric = headers.some(h => h.includes('matric') || h.includes('id'))
        const hasName = headers.some(h => h.includes('name'))

        if (!hasMatric || !hasName) {
          toast.error('CSV must contain "Matric Number" and "Name" columns.')
          return
        }

        setCsvHeaders(rows[0])
        setCsvPreview(rows.slice(1, 11)) // preview up to first 10 rows
      },
      error: () => toast.error('Failed to parse CSV file.')
    })
  }, [])

  const handleConfirmUpload = () => {
    setIsUploading(true)
    setUploadProgress(0)
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          toast.success(`${csvPreview.length} student records uploaded successfully.`)
          setCsvPreview([])
          setCsvHeaders([])
          setIsUploading(false)
          return 100
        }
        return prev + 10
      })
    }, 150)
  }

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
          <UploadCloud className="w-8 h-8 text-primary" /> Upload Student Records
        </h1>
        <p className="text-muted-foreground mt-1">Upload the list of officially registered university students in bulk.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column: drop zone & preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" /> CSV File Dropper
              </h3>
            </div>
            
            <div className="p-6">
              {csvPreview.length === 0 ? (
                <div 
                  className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer ${
                    isDragOver ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file) }}
                >
                  <UploadCloud className={`w-16 h-16 mx-auto mb-4 transition-all ${ isDragOver ? 'text-primary scale-110' : 'text-primary/50' }`} />
                  <h4 className="font-bold text-lg text-foreground mb-2">Click to select or drop your file</h4>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">Upload a standard CSV format containing student Matriculation Numbers and Full Names.</p>
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <FileText className="w-5 h-5" />
                      <span>Previewing Upload File</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => { setCsvPreview([]); setCsvHeaders([]) }}>
                      <X className="w-4 h-4 mr-1" /> Clear File
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          {csvHeaders.map((h, i) => (
                            <th key={i} className="p-3 text-left font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {csvPreview.map((row, ri) => (
                          <tr key={ri} className="hover:bg-muted/10">
                            {row.map((cell, ci) => (
                              <td key={ci} className="p-3 text-foreground font-medium">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {isUploading ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-bold">Processing student rows...</span>
                        <span className="font-mono text-primary font-bold">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <motion.div 
                          className="bg-primary h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ ease: 'easeInOut' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold gap-2 py-6 text-base rounded-xl shadow-lg shadow-primary/20"
                      onClick={handleConfirmUpload}
                    >
                      Process Student Records <ArrowRight className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Instructions & Details */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" /> Template Format
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your CSV file must match the EKSU student record database columns. Please verify that the column names are exactly matched.
            </p>

            <div className="p-4 rounded-xl bg-muted/30 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono font-bold">Matric Number</span>
                <span className="bg-green-500/10 text-green-500 font-bold px-2 py-0.5 rounded uppercase">Required</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono font-bold">Full Name</span>
                <span className="bg-green-500/10 text-green-500 font-bold px-2 py-0.5 rounded uppercase">Required</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono font-bold">Faculty</span>
                <span className="bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5 rounded uppercase">Optional</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Duplicate matric numbers in the uploaded list will automatically update existing data rather than inserting duplicates.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
