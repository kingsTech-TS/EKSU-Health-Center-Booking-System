'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, CheckCircle2, Calendar as CalendarIcon, AlertTriangle, Search, UploadCloud, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Papa from 'papaparse'
import { toast } from 'react-hot-toast'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts'
import { 
  useReactTable, getCoreRowModel, getFilteredRowModel, 
  getPaginationRowModel, getSortedRowModel, flexRender, 
  SortingState
} from '@tanstack/react-table'

// Mock Data
const mockStats = [
  { label: 'Total Students', value: 4520, icon: Users, color: 'text-primary' },
  { label: 'Fully Cleared', value: 3150, icon: CheckCircle2, color: 'text-green-500' },
  { label: 'Appts Today', value: 342, icon: CalendarIcon, color: 'text-secondary' },
  { label: 'Missed Appts', value: 89, icon: AlertTriangle, color: 'text-destructive' },
]

const mockStudents = Array.from({ length: 50 }).map((_, i) => ({
  id: `STU-${i}`,
  matricNo: `EKSU/2023/${(1000 + i).toString().padStart(4, '0')}`,
  name: `Student Name ${i}`,
  faculty: ['Science', 'Engineering', 'Arts', 'Law'][i % 4],
  phase: (i % 4) + 1,
  regDate: '2026-05-10'
}))

const barData = [
  { name: 'Mon', appts: 400 }, { name: 'Tue', appts: 300 }, { name: 'Wed', appts: 500 },
  { name: 'Thu', appts: 280 }, { name: 'Fri', appts: 390 },
]

const pieData = [
  { name: 'Phase 1', value: 400 },
  { name: 'Phase 2', value: 300 },
  { name: 'Phase 3', value: 300 },
  { name: 'Cleared', value: 200 },
]
const PIE_COLORS = ['#0B5E3C', '#E8960C', '#A8E6CF', '#C0392B']

export default function AdminDashboardPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [csvPreview, setCsvPreview] = useState<string[][]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
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
        setCsvHeaders(rows[0])
        setCsvPreview(rows.slice(1, 6)) // first 5 data rows
      },
      error: () => toast.error('Failed to parse CSV file.')
    })
  }, [])

  const handleConfirmUpload = () => {
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          toast.success(`${csvPreview.length + 1} student records uploaded successfully.`)
          setCsvPreview([])
          setCsvHeaders([])
          setIsUploading(false)
          return 100
        }
        return prev + 10
      })
    }, 150)
  }

  const columns = useMemo(() => [
    { accessorKey: 'matricNo', header: 'Matric No.' },
    { accessorKey: 'name', header: 'Student Name' },
    { accessorKey: 'faculty', header: 'Faculty' },
    { 
      accessorKey: 'phase', 
      header: 'Status',
      cell: (info: any) => {
        const val = info.getValue()
        return (
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            val === 4 ? 'bg-green-500/10 text-green-500' : 'bg-secondary/10 text-secondary'
          }`}>
            {val === 4 ? 'Cleared' : `Phase ${val}`}
          </span>
        )
      }
    },
    { accessorKey: 'regDate', header: 'Reg. Date' },
  ], [])

  const table = useReactTable({
    data: mockStudents,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground">Monitor system performance and manage student records.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {mockStats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-muted/50 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold font-mono text-foreground">{stat.value.toLocaleString()}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="font-bold mb-4 font-display text-lg text-foreground">Weekly Appointments</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="appts" fill="#0B5E3C" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="font-bold mb-4 font-display text-lg text-foreground">Phase Distribution</h3>
          <div className="h-64 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {pieData.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground font-medium">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CSV Upload Zone */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold font-display text-foreground flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" /> Record Upload
          </h3>
          <Button variant="outline" size="sm" onClick={() => { setIsUploading(!isUploading); setCsvPreview([]); setCsvHeaders([]) }}>
            {isUploading ? 'Cancel' : 'Upload CSV'}
          </Button>
        </div>
        
        <AnimatePresence>
          {isUploading && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="px-6 py-8 border-b border-border space-y-6"
            >
              {/* Drop Zone */}
              {csvPreview.length === 0 && (
                <div 
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                    isDragOver ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file) }}
                >
                  <UploadCloud className={`w-12 h-12 mx-auto mb-4 transition-all ${ isDragOver ? 'text-primary scale-110' : 'text-primary/50' }`} />
                  <h4 className="font-bold text-foreground mb-1">Click to upload or drag and drop</h4>
                  <p className="text-sm text-muted-foreground">CSV files only. Must contain Matric Number and Name columns.</p>
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                </div>
              )}

              {/* Preview Table */}
              {csvPreview.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                      <FileText className="w-4 h-4" />
                      <span className="font-bold text-sm">Preview — First {csvPreview.length} rows</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { setCsvPreview([]); setCsvHeaders([]) }}>
                      <X className="w-4 h-4 mr-1" /> Clear
                    </Button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30">
                        <tr>
                          {csvHeaders.map((h, i) => <th key={i} className="p-3 text-left font-bold text-muted-foreground uppercase tracking-wider">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {csvPreview.map((row, ri) => (
                          <tr key={ri} className="hover:bg-muted/30">
                            {row.map((cell, ci) => <td key={ci} className="p-3 font-mono">{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Progress bar */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Uploading records...</span><span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary rounded-full"
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.15 }}
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white shadow-[0_4px_14px_0_rgba(11,94,60,0.39)] gap-2"
                    onClick={handleConfirmUpload}
                    disabled={uploadProgress > 0 && uploadProgress < 100}
                  >
                    <UploadCloud className="w-4 h-4" /> Confirm Upload
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Student Records Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search students..." 
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="text-left p-4 font-bold text-muted-foreground" onClick={header.column.getToggleSortingHandler()}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border/50">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="p-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Prev</Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
