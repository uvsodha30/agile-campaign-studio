# Campaign Canvas

Build a single-page web app using React and Tailwind CSS called "Agile Campaign Brief Studio".

The app should have a clean, modern split-screen layout (Indigo and Slate theme):

LEFT PANEL (Form Inputs):

1. Campaign Overview:

   - Campaign Name (Text)

   - Strategic Goal (Dropdown: Product Launch, Brand Awareness, Lead Generation, Retention)

   - Target Channels (Multi-select pills: Paid Search, Social Media, Email, Programmatic)

2. Constraints & Parameters:

   - Total Budget ($ USD)

   - Target Launch Date (Date Picker)

   - Risk Sensitivity Level (Slider or Buttons: Low, Medium, High)

3. Action Button: "Generate Campaign Brief & Sprint Plan"

RIGHT PANEL (Dynamic Output):

1. Executive Header:

   - Displays Campaign Name, Strategic Goal badge, and auto-calculates Daily Burn Rate based on budget & target duration.

2. Interactive 4-Week Sprint Schedule:

   - Dynamically calculates dates for Week 1 (Discovery), Week 2 (Creative/Tech), Week 3 (QA & Testing), and Week 4 (Launch).

   - Includes checkable task items for each week so users can mark progress.

3. Automated RAID Log (Risks, Assumptions, Issues, Dependencies):

   - Pre-populates 3-4 realistic agency risks based on selected channels and risk level.

   - Includes Risk Level badges (High/Medium/Low) and Mitigation Strategies.

4. Export & Save Actions:

   - Dropdown or buttons to "Copy as Jira Markdown", "Copy as Asana Template", and "Save Brief".

   - Uses browser localStorage so saved briefs persist across page refreshes.

Ensure the UI is responsive, highly polished, interactive, and requires zero external API keys.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://agile-campaign-studio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9b5ae3d0-3a24-4ea5-8d01-4ab8a062efd1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
