import express from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import supabase from '../config/supabase.js'
import { verifyAdmin } from '../middleware/auth.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/', verifyAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })

  const { title } = req.body
  if (!title) return res.status(400).json({ error: 'Title required' })

  const ext = req.file.originalname.split('.').pop()
  const filename = `${uuidv4()}.${ext}`

  // Upload to Supabase Storage
  const { error: storageError } = await supabase.storage
    .from('tracks')
    .upload(filename, req.file.buffer, {
      contentType: req.file.mimetype,
    })

  if (storageError) return res.status(400).json({ error: storageError.message })

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('tracks')
    .getPublicUrl(filename)

  // Save to tracks table
  const { data, error } = await supabase
    .from('tracks')
    .insert({
      title,
      file_url: urlData.publicUrl,
      size: req.file.size,
      uploaded_by: req.user.id,
    })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  res.json({ message: 'Track uploaded', track: data })
})

export default router