export default function HelpPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-stable-800 mb-6">Help & Info</h1>

      <div className="space-y-6">
        {/* Getting Started */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stable-700 mb-4">🚀 Getting Started</h2>
          <div className="space-y-3 text-stable-600">
            <p><strong>1. Create a Barn:</strong> Set up your ranch workspace where you'll organize everything.</p>
            <p><strong>2. Invite Your Team:</strong> Go to Settings → Invite Members to add your crew.</p>
            <p><strong>3. Add Chores:</strong> Create daily tasks that everyone can see and check off.</p>
            <p><strong>4. Track Animals:</strong> Add your animals with photos and medical history.</p>
          </div>
        </section>

        {/* Chores */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stable-700 mb-4">✅ Managing Chores</h2>
          <div className="space-y-3 text-stable-600">
            <p><strong>Status Colors:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><span className="text-chore-todo font-medium">Yellow</span> - To Do (not started)</li>
              <li><span className="text-chore-progress font-medium">Blue</span> - In Progress (someone's working on it)</li>
              <li><span className="text-chore-done font-medium">Green</span> - Done (completed!)</li>
            </ul>
            <p><strong>Tip:</strong> Click on a chore's circle to cycle through statuses. Everyone sees updates in real-time!</p>
          </div>
        </section>

        {/* Animals */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stable-700 mb-4">🐴 Animal Profiles</h2>
          <div className="space-y-3 text-stable-600">
            <p>Each animal has a profile page where you can:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Upload a photo</li>
              <li>Track basic info (breed, age, weight, etc.)</li>
              <li>Record medical history (vet visits, vaccinations, etc.)</li>
              <li>Add notes</li>
            </ul>
          </div>
        </section>

        {/* Roles */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stable-700 mb-4">👥 Team Roles</h2>
          <div className="space-y-3 text-stable-600">
            <ul className="space-y-2">
              <li><strong>Owner:</strong> Full control - can delete barn, manage roles, and do everything.</li>
              <li><strong>Manager:</strong> Can add/edit chores, animals, events, and invite new members.</li>
              <li><strong>Member:</strong> Can check off chores, view info, and add notes.</li>
              <li><strong>Viewer:</strong> Read-only access (great for vets or visiting owners).</li>
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stable-700 mb-4">📧 Need More Help?</h2>
          <p className="text-stable-600">
            Questions or feedback? Reach out to us at{' '}
            <a href="mailto:support@stable-app.com" className="text-stable-700 font-medium underline">
              support@stable-app.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
