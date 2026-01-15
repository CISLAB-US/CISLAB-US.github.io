---
description: Push changes to the production CISL website
---

# Push to Production

This workflow pushes changes to the production site at https://cislab-us.github.io/

## Steps

1. Check git status to see what files have changed
// turbo

2. Stage all changes
```
git add .
```

3. Commit with a descriptive message
```
git commit -m "<describe the changes>"
```

4. Push to the **cislab** remote (production site)
```
git push cislab main
```

> **Note**: Do NOT push to `origin` - that's the personal fork at AngadSingh22/CISL_Website.
> The production site is hosted from the `cislab` remote (CISLAB-US/CISLAB-US.github.io).
