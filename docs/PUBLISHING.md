# Publish the portfolio under your own GitHub account

The public source repository is **[https://github.com/itsbdk03/Brandon-Keesecker-Cyber](https://github.com/itsbdk03/Brandon-Keesecker-Cyber)**. This guide covers verification and optional GitHub Pages hosting. Separating focused engines into additional repositories is a possible later step.

## 1. Review before making public

- Confirm every experience, certification, and academic statement is accurate. A doctorate is a **plan**, not a completed degree.
- Confirm the contact email in `index.html` is the one you want made public.
- Do **not** include employer/customer artifacts, credentials, access tokens, CUI, PHI, or internal vulnerability details.
- The code uses synthetic examples. Do not describe it as production assessment tooling or professional client work.
- Decide what license, if any, you want to publish under. This starter does not automatically grant an open-source license.

## 2. Keep the repository up to date

The repository already exists. For future changes, clone the repo, edit and test files, commit, and push to `main` or submit a pull request. Do not commit secrets or confidential materials.

```bash
git clone https://github.com/itsbdk03/Brandon-Keesecker-Cyber.git
cd Brandon-Keesecker-Cyber
```

## 3. Run the verification checks

```bash
npm run check:js
npm run verify
```

The GitHub Actions workflow also runs on new pushes and pull requests. Allow workflows in your repository settings if prompted. CI checks the exported code; it does not conduct production penetration testing.

## 4. Publish GitHub Pages

On the GitHub repository open **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, select **main** and **/(root)**, then Save. Once deployed, your site will be accessible at a URL with the format `https://itsbdk03.github.io/Brandon-Keesecker-Cyber/`. The actual URL depends on your username and Pages settings.

## 5. Link the public repo

After publishing, add the repository URL to your portfolio's GitHub link area (or ask ChatGPT to update the site) and Netlify profile. To add individual focused GitHub projects later, separate the six lab engines into their own repos, including tests, screenshots, and limitations.
