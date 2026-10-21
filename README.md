# NightNote — Full-stack Notes App

A responsive dark-premium notes app built with **HTML, CSS, vanilla JavaScript, Supabase Auth, and Supabase PostgreSQL**. The frontend uses no framework. Supabase provides the backend authentication and database needed for Levels 2–5.

## Features

- Level 1: public promotional landing page for guests.
- Level 2: email/password registration and login.
- Level 3: create notes with a title and content.
- Level 4: notes are scoped to the signed-in user using PostgreSQL Row Level Security (RLS).
- Level 5: edit and delete your own notes.
- Responsive layout, search, empty states, and confirmation before deleting.

## 1. Create the Supabase project

1. Go to [Supabase](https://supabase.com/) and create a project.
2. In the project dashboard, open **SQL Editor** and run all of `schema.sql` (included in this repository).
3. Open **Project Settings → API** (or the Connect panel). Copy the **Project URL** and the **anon/publishable key**.
4. Open `app.js` and replace these two values at the top:

   ```js
   const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY';
   ```

   The browser key is expected to be the anon/publishable key. **Never paste a `service_role` or secret key into frontend code or GitHub.** RLS protects user data.

5. In Supabase **Authentication → URL Configuration**, set the Site URL to your local URL while testing (for example `http://localhost:5500`) and add your eventual deployed URL to Redirect URLs. For easiest first-time testing, you can temporarily disable email confirmation in **Authentication → Providers → Email**; otherwise, users must confirm their email before logging in.

## 2. Run locally

### Easy option: VS Code + Live Server

1. Install Visual Studio Code and the **Live Server** extension.
2. Open this folder in VS Code.
3. Right-click `index.html` → **Open with Live Server**.
4. The browser opens a local URL such as `http://127.0.0.1:5500`.

Do not just double-click `index.html` if auth redirects or browser module/CDN behaviour gives problems. A local web server is more reliable.

## 3. Push your project to your own GitHub repository

1. Sign in to [GitHub](https://github.com/).
2. Click **+ → New repository**. Name it `nightnote-notes-app`, set it to **Public**, and create it. You can skip adding a README because this folder already contains one.
3. In the new repository, choose **Add file → Upload files** and upload `index.html`, `style.css`, `app.js`, `schema.sql`, and `README.md` (upload the files, not just the ZIP).
4. Commit the files to the `main` branch.
5. Open the repository page and copy its URL. This is your **Evaluation Project GitHub Link**.

### Alternative: Git commands

Run these in the project folder after creating an empty public repository on GitHub:

```bash
git init
git add .
git commit -m "Build NightNote notes app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nightnote-notes-app.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username. If Git asks you to authenticate, follow GitHub's sign-in prompts.

## 4. Deploy with GitHub Pages (static frontend)

GitHub Pages can host this static HTML/CSS/JS app. Supabase still runs the authentication and database.

1. Open your public `nightnote-notes-app` repository.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose branch `main`, folder `/ (root)`, then **Save**.
5. Wait for the deployment URL shown on the Pages settings screen. It will look similar to `https://YOUR_USERNAME.github.io/nightnote-notes-app/`.
6. Add that exact deployed URL to Supabase **Authentication → URL Configuration → Redirect URLs** and set it as the Site URL if this is your primary deployment.
7. Open the public link in a private/incognito window and test registration, login, and notes.

Use the URL shown by GitHub Pages for your **Evaluation Project Public Link**. Do not submit the repository URL in that field.

## 5. Submit the Zynax pull request

The assignment says to fork [CS-Society-USM/tech-evaluation-zynax](https://github.com/CS-Society-USM/tech-evaluation-zynax), make a change, and submit a pull request. That repository's current README says to fork it, make any changes, and submit a PR.

1. Open the repository link above and click **Fork**.
2. In your fork, make a small genuine change, such as updating the README to add your project name and your public deployed URL. Commit it to a new branch if GitHub offers that workflow.
3. Open **Contribute → Open pull request** (or **Compare & pull request**).
4. Check that the base repository is `CS-Society-USM/tech-evaluation-zynax` and the head repository is your fork. Add a clear title such as `Add NightNote evaluation project link` and a short description.
5. Submit the pull request. Copy the PR URL for your records.
6. Only answer **Yes** to “Have you made a pull request?” after the PR has actually been created.

The project code repository and the Zynax evaluation repository serve different purposes: submit your app's GitHub URL in the project field, your deployed website URL in the public-link field, and create a separate PR on the Zynax repository following its README.

## Database schema and security

See `schema.sql`. It enables RLS and adds policies so a logged-in user can select, insert, update, and delete only rows whose `user_id` matches their authenticated user ID. Do not remove these policies for a public deployment.

## Troubleshooting

- **Setup needed message:** `app.js` still has placeholder Supabase credentials.
- **Email confirmation message:** confirm the signup email, or adjust the email confirmation setting for testing.
- **Database permissions / RLS error:** run `schema.sql` in the correct Supabase project's SQL Editor.
- **Blank page after publishing:** confirm all files are in the repository root and the main file is named `index.html`.
- **Notes from one user must never appear for another:** keep RLS enabled. The UI filter alone is not a security boundary; the database policies are what enforce ownership.
