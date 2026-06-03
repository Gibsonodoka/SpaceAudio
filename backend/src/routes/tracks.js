import express from 'express'
import supabase from '../config/supabase.js'
import { verifyAdmin } from '../middleware/auth.js'

const router = express.Router()

// Get all tracks
router.get('/', verifyAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// Delete a track
router.delete('/:id', verifyAdmin, async (req, res) => {
  const { data: track } = await supabase
    .from('tracks')
    .select('file_url')
    .eq('id', req.params.id)
    .single()

  if (track) {
    const path = track.file_url.split('/tracks/')[1]
    await supabase.storage.from('tracks').remove([path])
  }

  const { error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Track deleted' })
})

export default router