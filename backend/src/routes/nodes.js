import express from 'express'
import supabase from '../config/supabase.js'
import { verifyAdmin } from '../middleware/auth.js'

const router = express.Router()

// Get all nodes
router.get('/', verifyAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('nodes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// Get single node
router.get('/:id', verifyAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('nodes')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (error) return res.status(404).json({ error: 'Node not found' })
  res.json(data)
})

// Delete a node
router.delete('/:id', verifyAdmin, async (req, res) => {
  const { error } = await supabase
    .from('nodes')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Node deleted' })
})

export default router