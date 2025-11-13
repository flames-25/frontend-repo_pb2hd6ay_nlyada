import { useEffect, useMemo, useState } from 'react'

function Label({ children }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
}

function Input(props) {
  return <input {...props} className={`w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${props.className || ''}`} />
}

function Select(props) {
  return (
    <select {...props} className={`w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${props.className || ''}`} />
  )
}

function Section({ title, children, right }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}

export default function App() {
  const baseUrl = useMemo(() => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', [])

  // Global state
  const [status, setStatus] = useState('Checking backend...')
  const [email, setEmail] = useState('')

  // Profile
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    body_type: '',
    skin_tone: '',
    preferred_colors: '',
    vibe: '',
    location: '',
  })
  const [fetchedProfile, setFetchedProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Wardrobe
  const [item, setItem] = useState({
    owner_email: '',
    name: '',
    category: 'top',
    color: '',
    size: '',
    image_url: '',
    brand: '',
    price: '',
    tags: '',
    warmth: ''
  })
  const [wardrobe, setWardrobe] = useState([])
  const [wardrobeLoading, setWardrobeLoading] = useState(false)

  // Outfit
  const [gen, setGen] = useState({ mood: '', weather: '', event: '' })
  const [generated, setGenerated] = useState(null)
  const [challenges, setChallenges] = useState([])

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(baseUrl)
        const j = await r.json()
        setStatus(`✅ ${j.message}`)
      } catch (e) {
        setStatus(`❌ Cannot reach backend at ${baseUrl}`)
      }
      try {
        const r = await fetch(`${baseUrl}/api/challenges`)
        if (r.ok) setChallenges(await r.json())
      } catch {}
    })()
  }, [baseUrl])

  const toast = (msg) => alert(msg)

  // Actions
  const saveProfile = async () => {
    try {
      setProfileLoading(true)
      const payload = {
        ...profile,
        preferred_colors: profile.preferred_colors
          ? profile.preferred_colors.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      }
      const r = await fetch(`${baseUrl}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error(await r.text())
      const j = await r.json()
      toast('Profile saved')
      setEmail(profile.email)
      setFetchedProfile(payload)
      return j
    } catch (e) {
      toast(`Failed to save profile: ${e.message}`)
    } finally {
      setProfileLoading(false)
    }
  }

  const fetchProfile = async () => {
    if (!email) return toast('Enter email to fetch profile')
    try {
      setProfileLoading(true)
      const r = await fetch(`${baseUrl}/api/profile?email=${encodeURIComponent(email)}`)
      if (!r.ok) throw new Error(await r.text())
      const j = await r.json()
      setFetchedProfile(j)
    } catch (e) {
      toast(`Profile fetch failed: ${e.message}`)
      setFetchedProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  const addItem = async () => {
    try {
      setWardrobeLoading(true)
      const payload = {
        ...item,
        owner_email: item.owner_email || email,
        price: item.price ? Number(item.price) : undefined,
        tags: item.tags ? item.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
        warmth: item.warmth ? Number(item.warmth) : undefined,
      }
      if (!payload.owner_email) return toast('Provide owner email')
      const r = await fetch(`${baseUrl}/api/wardrobe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error(await r.text())
      await listWardrobe(payload.owner_email)
      setItem({ owner_email: payload.owner_email, name: '', category: 'top', color: '', size: '', image_url: '', brand: '', price: '', tags: '', warmth: '' })
      toast('Item added')
    } catch (e) {
      toast(`Add item failed: ${e.message}`)
    } finally {
      setWardrobeLoading(false)
    }
  }

  const listWardrobe = async (owner = email) => {
    if (!owner) return toast('Enter email to list wardrobe')
    try {
      setWardrobeLoading(true)
      const r = await fetch(`${baseUrl}/api/wardrobe?email=${encodeURIComponent(owner)}`)
      if (!r.ok) throw new Error(await r.text())
      const j = await r.json()
      setWardrobe(j)
    } catch (e) {
      toast(`Fetch wardrobe failed: ${e.message}`)
    } finally {
      setWardrobeLoading(false)
    }
  }

  const generateOutfit = async () => {
    if (!email) return toast('Enter email (profile owner)')
    try {
      const r = await fetch(`${baseUrl}/api/outfits/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...gen }),
      })
      if (!r.ok) throw new Error(await r.text())
      const j = await r.json()
      setGenerated(j)
      toast('Outfit generated')
    } catch (e) {
      toast(`Generation failed: ${e.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <header className="sticky top-0 backdrop-blur bg-white/70 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-inner" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mazzura</h1>
              <p className="text-xs text-gray-500 -mt-0.5">AI-Powered Cultural Fashion OS</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">{status}</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <Section title="Your Email">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mazzura.app" />
            <div className="flex gap-2 mt-3">
              <button onClick={fetchProfile} className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Fetch Profile</button>
              <button onClick={() => listWardrobe()} className="px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-black">Load Wardrobe</button>
            </div>
          </Section>

          <Section title="AI Challenges" right={<span className="text-xs text-gray-500">Gen-Z community</span>}>
            <ul className="space-y-2">
              {challenges.map((c, i) => (
                <li key={i} className="p-3 rounded-md bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800">{c.title}</p>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">+{c.reward_points}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{c.prompt}</p>
                </li>
              ))}
              {challenges.length === 0 && <p className="text-sm text-gray-500">Loading challenges...</p>}
            </ul>
          </Section>

          <Section title="Generate Outfit" right={<span className="text-xs text-gray-500">Mood · Weather · Event</span>}>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Mood</Label>
                <Input value={gen.mood} onChange={(e) => setGen({ ...gen, mood: e.target.value })} placeholder="cozy, bold, minimal" />
              </div>
              <div>
                <Label>Weather</Label>
                <Select value={gen.weather} onChange={(e) => setGen({ ...gen, weather: e.target.value })}>
                  <option value="">Select</option>
                  <option>cold</option>
                  <option>warm</option>
                  <option>hot</option>
                  <option>chilly</option>
                  <option>rainy</option>
                </Select>
              </div>
              <div>
                <Label>Event</Label>
                <Input value={gen.event} onChange={(e) => setGen({ ...gen, event: e.target.value })} placeholder="brunch, office, garba" />
              </div>
            </div>
            <button onClick={generateOutfit} className="mt-3 w-full px-3 py-2 rounded-md bg-fuchsia-600 text-white hover:bg-fuchsia-700">Generate</button>
            {generated && (
              <div className="mt-4 p-3 rounded-md border border-gray-100 bg-gray-50">
                <p className="font-semibold text-gray-800 mb-2">{generated.title}</p>
                <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                  {generated.items?.map((it, i) => (
                    <li key={i}>{it.category}: {it.name} {it.color ? `· ${it.color}` : ''} {it.brand ? `· ${it.brand}` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Section title="Build Your Fashion DNA">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Aisha Rao" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="you@mazzura.app" />
              </div>
              <div>
                <Label>Body Type</Label>
                <Input value={profile.body_type} onChange={(e) => setProfile({ ...profile, body_type: e.target.value })} placeholder="pear, athletic, curvy" />
              </div>
              <div>
                <Label>Skin Tone</Label>
                <Input value={profile.skin_tone} onChange={(e) => setProfile({ ...profile, skin_tone: e.target.value })} placeholder="warm, cool, neutral" />
              </div>
              <div>
                <Label>Preferred Colors (comma)</Label>
                <Input value={profile.preferred_colors} onChange={(e) => setProfile({ ...profile, preferred_colors: e.target.value })} placeholder="black, lilac, sage" />
              </div>
              <div>
                <Label>Vibe</Label>
                <Input value={profile.vibe} onChange={(e) => setProfile({ ...profile, vibe: e.target.value })} placeholder="soft, bold, minimal" />
              </div>
              <div className="md:col-span-2">
                <Label>Location</Label>
                <Input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="Bengaluru, IN" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button disabled={profileLoading} onClick={saveProfile} className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">{profileLoading ? 'Saving...' : 'Save Profile'}</button>
              <button disabled={profileLoading} onClick={fetchProfile} className="px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-black disabled:opacity-60">Fetch by Email</button>
            </div>
            {fetchedProfile && (
              <div className="mt-4 p-3 rounded-md border border-gray-100 bg-gray-50 text-sm text-gray-700">
                <p className="font-semibold text-gray-800 mb-1">Profile</p>
                <pre className="whitespace-pre-wrap break-words">{JSON.stringify(fetchedProfile, null, 2)}</pre>
              </div>
            )}
          </Section>

          <Section title="Smart Closet">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Owner Email</Label>
                <Input value={item.owner_email || email} onChange={(e) => setItem({ ...item, owner_email: e.target.value })} placeholder="you@mazzura.app" />
              </div>
              <div>
                <Label>Item Name</Label>
                <Input value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} placeholder="Oversized tee" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={item.category} onChange={(e) => setItem({ ...item, category: e.target.value })}>
                  <option>top</option>
                  <option>bottom</option>
                  <option>outerwear</option>
                  <option>footwear</option>
                  <option>accessory</option>
                </Select>
              </div>
              <div>
                <Label>Color</Label>
                <Input value={item.color} onChange={(e) => setItem({ ...item, color: e.target.value })} placeholder="black" />
              </div>
              <div>
                <Label>Size</Label>
                <Input value={item.size} onChange={(e) => setItem({ ...item, size: e.target.value })} placeholder="M" />
              </div>
              <div>
                <Label>Brand</Label>
                <Input value={item.brand} onChange={(e) => setItem({ ...item, brand: e.target.value })} placeholder="Local craft" />
              </div>
              <div>
                <Label>Price</Label>
                <Input value={item.price} onChange={(e) => setItem({ ...item, price: e.target.value })} placeholder="1299" />
              </div>
              <div>
                <Label>Tags (comma)</Label>
                <Input value={item.tags} onChange={(e) => setItem({ ...item, tags: e.target.value })} placeholder="street, monochrome" />
              </div>
              <div>
                <Label>Warmth (0-10)</Label>
                <Input value={item.warmth} onChange={(e) => setItem({ ...item, warmth: e.target.value })} placeholder="3" />
              </div>
              <div className="md:col-span-2">
                <Label>Image URL (optional)</Label>
                <Input value={item.image_url} onChange={(e) => setItem({ ...item, image_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button disabled={wardrobeLoading} onClick={addItem} className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">Add Item</button>
              <button disabled={wardrobeLoading} onClick={() => listWardrobe(item.owner_email || email)} className="px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-black disabled:opacity-60">View Wardrobe</button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {wardrobe.map((w) => (
                <div key={w.id} className="p-3 rounded-md border border-gray-100 bg-white flex gap-3 items-center">
                  <div className="h-12 w-12 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center text-xs text-gray-500">
                    {w.image_url ? (
                      <img src={w.image_url} alt={w.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{w.category}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{w.name}</p>
                    <p className="text-xs text-gray-500 truncate">{w.brand || '—'} · {w.color || '—'} · {w.size || '—'}</p>
                  </div>
                </div>
              ))}
              {wardrobe.length === 0 && (
                <p className="text-sm text-gray-500">No items yet. Add your first piece.</p>
              )}
            </div>
          </Section>
        </div>

        <p className="text-center text-xs text-gray-500">Cultural fashion intelligence · India-first · Emotion-aware AI</p>
      </main>
    </div>
  )
}
