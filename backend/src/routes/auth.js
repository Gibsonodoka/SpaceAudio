import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import supabase from '../config/supabase.js'
import { verifyAdmin } from '../middleware/auth.js'

const router = express.Router()

// Admin register (only use once to create your first admin)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required' })

  const hashed = await bcrypt.hash(password, 10)

  const { data, error } = await supabase
    .from('users')
    .insert({ name, email, password: hashed, role: 'admin' })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  res.json({ message: 'Admin created', user: { id: data.id, name: data.name, email: data.email } })
})

// Admin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' })

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !user) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

// Create a node (admin only)
router.post('/nodes/create', verifyAdmin, async (req, res) => {
  const { name, location } = req.body
  if (!name) return res.status(400).json({ error: 'Node name required' })

  const nodeToken = jwt.sign(
    { type: 'node', nodeId: uuidv4() },
    process.env.JWT_SECRET
  )

  const { data, error } = await supabase
    .from('nodes')
    .insert({ name, location, token: nodeToken, status: 'offline' })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  res.json({ message: 'Node created', node: data })
})

export default router