<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Plant identification runs in an auth-protected server function (src/lib/plant.functions.ts) via Lovable AI Gateway Gemini; saved plants live in the Cloud `plants` table (RLS per user, thumbnails stored as data URLs), pages under src/routes/_authenticated require sign-in.
