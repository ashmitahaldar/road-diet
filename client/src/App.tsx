import { PLACEHOLDER_LEVEL } from '@road-diet/shared'
import { Editor } from './editor/Editor'

export default function App() {
  const level = PLACEHOLDER_LEVEL
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="font-display text-4xl font-semibold">Road Diet</h1>
        <p className="mt-1 text-lg">Every street has a budget. How would you spend it?</p>
        <p className="mt-2">
          <strong>{level.name}</strong> · {level.corridor.widthM} m wide · placeholder data
        </p>
      </header>
      <main className="flex-1">
        <Editor level={level} />
      </main>
      <footer className="text-sm">A learning tool, not a forecast. Residents are fictional.</footer>
    </div>
  )
}
