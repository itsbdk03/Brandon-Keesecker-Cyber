# Illustrated architecture posters

This folder contains the original AI-generated reference-architecture posters from the portfolio design conversation. **Do not** claim these images are audited, authorized, certified, or engineering drawings for a real organization. Check any model- or vendor-specific claim against official requirements before reusing.

The library at [../index.html](../index.html) automatically displays each file in **Illustrated poster** mode when that image exists. The **Interactive diagram** mode continues to work independently and is the safe fallback if a poster is not uploaded.

| Portfolio tab | Required uploaded file |
|---|---|
| FedRAMP Moderate | `fedramp-moderate.webp` |
| FedRAMP High | `fedramp-high.webp` |
| DoD IL4 | `dod-il4.webp` |
| DoD IL5 | `dod-il5.webp` |
| CMMC Level 2 Enclave | `cmmc-l2.webp` |
| HITRUST CSF | `hitrust.webp` |
| HIPAA Security Rule | `hipaa.webp` |
| SOC 2 | `soc2.webp` |

## Upload instructions

1. Download and unzip the `architecture-posters-for-github.zip` file supplied in ChatGPT.
2. In the GitHub repository, open `architectures/posters/`.
3. Use **Add file → Upload files** to add the eight `.webp` files **directly into this folder**. Do not upload the nested `architectures/` directory itself here.
4. Commit the uploads to `main` and wait for GitHub Pages to deploy.
5. Visit `/architectures/#fedramp-moderate`, select **Illustrated poster**, and verify all eight tabs.

Each compressed asset is roughly 0.4 MB; all eight are approximately 3.3 MB, much smaller than the original PNGs. The website does not depend on third-party image hosts or CDN providers.
