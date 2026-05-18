## Inkludér ROS-analyser i «Siste dokumenter»

I dag henter dashbordet kun fra `fire_concepts`. ROS-analyser (`ros_analyses`) skal også telle som dokumenter brukeren jobber med.

### Endringer

**1. `src/components/dashboard/DashboardPanel.tsx` (widget på forsiden)**
- Hent også de 5 nyeste fra `ros_analyses` parallelt med `fire_concepts`.
- Slå sammen begge listene, sortér på `updated_at` desc, vis topp 3 i «Siste dokumenter».
- Tell ROS-analyser med i totalantall dokumenter.
- Lenke ROS-rader til `/ros-analyse?project=<project_id>&analysis=<id>` (matcher eksisterende rute i `RosAnalyse.tsx`; verifiseres ved implementering).
- Behold eksisterende logikk for Brensellagring-konsepter.

**2. `src/pages/Dashboard.tsx` (full dashboard-side)**
- Hent også `ros_analyses` (siste 20) parallelt.
- Slå sammen med `fire_concepts` til én liste «Siste dokumenter», sortert på `updated_at`.
- I tabellen/listen markér dokumenttype (Brannkonsept / Tilstandsvurdering / ROS) som en liten etikett, slik at brukeren ser hva det er.
- Oppdatér statistikk-kortet «Konsepter» til «Dokumenter» som teller begge typer.

### Ikke endret
- Database, RLS og ROS-import er uberørt.
- Andre sider (Mine prosjekter, Mine oppgaver) er uberørt.
