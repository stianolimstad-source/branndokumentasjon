import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, ArrowLeft, Flame, Gauge, Ruler, Thermometer, Wind } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type GrowthKey = "slow" | "medium" | "fast" | "ultra" | "custom";

const growthCategories: Record<Exclude<GrowthKey, "custom">, { label: string; tg: number; alpha: number }> = {
  slow: { label: "Langsom", tg: 600, alpha: 0.00278 },
  medium: { label: "Medium", tg: 300, alpha: 0.0111 },
  fast: { label: "Rask", tg: 150, alpha: 0.0444 },
  ultra: { label: "Ultra rask", tg: 75, alpha: 0.1778 },
};

const chartConfig = {
  hrr: { label: "Branneffekt", color: "hsl(var(--primary))" },
  smokeLayerHeight: { label: "Røyklagshøyde", color: "hsl(var(--accent-foreground))" },
  upperTemp: { label: "Øvre-lag temp.", color: "hsl(var(--destructive))" },
  smokeVolume: { label: "Røykvolum", color: "hsl(var(--muted-foreground))" },
} satisfies ChartConfig;

const formatTime = (seconds: number | null) => {
  if (seconds === null || !Number.isFinite(seconds)) return "Ikke nådd";
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")} min`;
};

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const Brannsimulering = () => {
  const [length, setLength] = useState(20);
  const [width, setWidth] = useState(12);
  const [height, setHeight] = useState(3.6);
  const [fireSourceHeight, setFireSourceHeight] = useState(0);
  const [growth, setGrowth] = useState<GrowthKey>("fast");
  const [customAlpha, setCustomAlpha] = useState(0.0444);
  const [qMax, setQMax] = useState(5000);
  const [duration, setDuration] = useState(600);
  const [timeStep, setTimeStep] = useState(10);
  const [criticalHeight, setCriticalHeight] = useState(2);
  const [convectiveFraction, setConvectiveFraction] = useState(0.7);
  const [ambientTemp, setAmbientTemp] = useState(20);
  const [exhaustRate, setExhaustRate] = useState(0);
  const [openingArea, setOpeningArea] = useState(0);

  const roomArea = Math.max(length * width, 1);
  const roomVolume = Math.max(roomArea * height, 1);
  const alpha = growth === "custom" ? customAlpha : growthCategories[growth].alpha;

  const simulation = useMemo(() => {
    const rows: Array<{
      time: number;
      hrr: number;
      smokeLayerHeight: number;
      smokeLayerThickness: number;
      upperTemp: number;
      smokeVolume: number;
    }> = [];

    const dt = Math.max(timeStep, 1);
    const maxTime = Math.max(duration, dt);
    const rho = 1.2;
    const cp = 1.0;
    let smokeVolume = 0;
    let smokeMass = 0;
    let convectiveEnergy = 0;
    let criticalTime: number | null = null;
    let qMaxTime: number | null = null;

    for (let time = 0; time <= maxTime; time += dt) {
      const hrr = Math.min(Math.max(alpha, 0) * time ** 2, Math.max(qMax, 0));
      if (qMaxTime === null && hrr >= qMax && qMax > 0) qMaxTime = time;

      const currentLayerHeight = Math.max(height - smokeVolume / roomArea, 0.05);
      const plumeHeight = Math.max(currentLayerHeight - fireSourceHeight, 0.1);
      const convectiveHrr = Math.max(hrr * convectiveFraction, 0);
      const plumeMassFlow = 0.071 * Math.cbrt(Math.max(convectiveHrr, 0.001)) * plumeHeight ** (5 / 3);
      const plumeVolumeFlow = plumeMassFlow / rho;
      const openingFlow = openingArea > 0 ? openingArea * 0.25 * Math.sqrt(Math.max(height - currentLayerHeight, 0)) : 0;
      const removedVolume = Math.max(exhaustRate + openingFlow, 0) * dt;

      smokeVolume = Math.min(Math.max(smokeVolume + plumeVolumeFlow * dt - removedVolume, 0), roomVolume);
      smokeMass = Math.max(smokeVolume * rho, 0.001);
      convectiveEnergy += convectiveHrr * dt;

      const smokeLayerThickness = Math.min(smokeVolume / roomArea, height);
      const smokeLayerHeight = Math.max(height - smokeLayerThickness, 0);
      const heatLossFactor = 0.18;
      const upperTemp = ambientTemp + (convectiveEnergy * (1 - heatLossFactor)) / (smokeMass * cp);

      if (criticalTime === null && smokeLayerHeight <= criticalHeight) criticalTime = time;

      rows.push({
        time,
        hrr: Math.round(hrr),
        smokeLayerHeight: Number(smokeLayerHeight.toFixed(2)),
        smokeLayerThickness: Number(smokeLayerThickness.toFixed(2)),
        upperTemp: Number(Math.min(upperTemp, 1200).toFixed(0)),
        smokeVolume: Number(smokeVolume.toFixed(1)),
      });
    }

    const last = rows[rows.length - 1];
    return {
      rows,
      criticalTime,
      qMaxTime,
      maxHrr: Math.max(...rows.map((row) => row.hrr)),
      criticalTemp: criticalTime === null ? null : rows.find((row) => row.time === criticalTime)?.upperTemp ?? null,
      finalLayerHeight: last?.smokeLayerHeight ?? height,
    };
  }, [alpha, ambientTemp, convectiveFraction, criticalHeight, duration, exhaustRate, fireSourceHeight, height, openingArea, qMax, roomArea, roomVolume, timeStep]);

  const summaryCards = [
    { icon: Gauge, label: "Tid til kritisk røyklag", value: formatTime(simulation.criticalTime) },
    { icon: Flame, label: "Maks branneffekt", value: `${simulation.maxHrr.toLocaleString("nb-NO")} kW` },
    { icon: Activity, label: "Tid til Qmax", value: formatTime(simulation.qMaxTime) },
    {
      icon: Thermometer,
      label: "Temp. ved kritisk høyde",
      value: simulation.criticalTemp === null ? "Ikke nådd" : `${simulation.criticalTemp} °C`,
    },
    { icon: Ruler, label: "Røyklagshøyde ved slutt", value: `${simulation.finalLayerHeight.toFixed(2)} m` },
  ];

  return (
    <main className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <Button asChild variant="ghost" size="sm">
            <Link to="/verktoy">
              <ArrowLeft className="mr-2 h-4 w-4" /> Tilbake til beregningsverktøy
            </Link>
          </Button>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Brannsimulering / røykutvikling</h1>
            <p className="max-w-3xl text-muted-foreground">
              Forenklet to-sonemodell for brannvekst, røykutvikling og røyklagshøyde i tidlig fase.
            </p>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Forenklet tidligfasemodell</AlertTitle>
            <AlertDescription>
              Dette er en forenklet tidligfasemodell for overslagsberegninger. Modellen gir ikke samme presisjon som CFAST eller CFD/FDS/PyroSim, men kan brukes til å sammenligne scenarier og vurdere størrelsesorden for røykutvikling, brannvekst og tilgjengelig tid før kritiske forhold.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rom</CardTitle>
                  <CardDescription>Geometri for ett rom / én sone.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <NumberField label="Lengde (m)" value={length} onChange={setLength} />
                  <NumberField label="Bredde (m)" value={width} onChange={setWidth} />
                  <NumberField label="Høyde (m)" value={height} onChange={setHeight} />
                  <NumberField label="Brannkildens høyde (m)" value={fireSourceHeight} onChange={setFireSourceHeight} />
                  <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                    Gulvareal: <span className="font-medium text-foreground">{roomArea.toFixed(1)} m²</span> · Volum: <span className="font-medium text-foreground">{roomVolume.toFixed(1)} m³</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Brann</CardTitle>
                  <CardDescription>t²-brann med valgt veksthastighet og maksimal effekt.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="growth">Brannvekstkategori</Label>
                    <select
                      id="growth"
                      value={growth}
                      onChange={(event) => setGrowth(event.target.value as GrowthKey)}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {Object.entries(growthCategories).map(([key, category]) => (
                        <option key={key} value={key}>
                          {category.label} – t_g {category.tg} s – α {category.alpha}
                        </option>
                      ))}
                      <option value="custom">Egendefinert α</option>
                    </select>
                  </div>
                  {growth === "custom" && <NumberField label="Egendefinert α (kW/s²)" value={customAlpha} onChange={setCustomAlpha} step="0.0001" />}
                  <NumberField label="Maks branneffekt Qmax (kW)" value={qMax} onChange={setQMax} />
                  <NumberField label="Simuleringstid (s)" value={duration} onChange={setDuration} />
                  <NumberField label="Tidssteg (s)" value={timeStep} onChange={setTimeStep} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Røyk og ventilasjon</CardTitle>
                  <CardDescription>Kriterier og enkel røykfjerning.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <NumberField label="Kritisk røyklagshøyde (m)" value={criticalHeight} onChange={setCriticalHeight} />
                  <NumberField label="Konvektiv andel" value={convectiveFraction} onChange={setConvectiveFraction} step="0.05" />
                  <NumberField label="Omgivelsestemperatur (°C)" value={ambientTemp} onChange={setAmbientTemp} />
                  <NumberField label="Avtrekk (m³/s)" value={exhaustRate} onChange={setExhaustRate} />
                  <NumberField label="Åpningsareal / røykluke (m²)" value={openingArea} onChange={setOpeningArea} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {summaryCards.map((card) => (
                  <Card key={card.label}>
                    <CardContent className="p-4">
                      <card.icon className="mb-3 h-5 w-5 text-primary" />
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                      <p className="mt-1 text-lg font-semibold leading-tight">{card.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <ChartCard title="Branneffekt over tid" description="Q(t) = min(α · t², Qmax)">
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <ComposedChart data={simulation.rows} margin={{ left: 8, right: 16, top: 16, bottom: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} unit=" s" />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} unit=" kW" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="hrr" fill="var(--color-hrr)" fillOpacity={0.18} stroke="var(--color-hrr)" />
                    </ComposedChart>
                  </ChartContainer>
                </ChartCard>

                <ChartCard title="Røyklagshøyde" description="Høyde fra gulv til underside av røyklag.">
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <ComposedChart data={simulation.rows} margin={{ left: 8, right: 16, top: 16, bottom: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} unit=" s" />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} unit=" m" domain={[0, height]} />
                      <ReferenceLine y={criticalHeight} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="smokeLayerHeight" stroke="var(--color-smokeLayerHeight)" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ChartContainer>
                </ChartCard>

                <ChartCard title="Estimert øvre-lag-temperatur" description="Indikativ temperatur basert på akkumulert konvektiv energi.">
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <ComposedChart data={simulation.rows} margin={{ left: 8, right: 16, top: 16, bottom: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} unit=" s" />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} unit=" °C" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="upperTemp" stroke="var(--color-upperTemp)" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ChartContainer>
                </ChartCard>

                <ChartCard title="Akkumulert røykvolum" description="Beregnet røykvolum etter fratrekk for enkel ventilasjon.">
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <ComposedChart data={simulation.rows} margin={{ left: 8, right: 16, top: 16, bottom: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} unit=" s" />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} unit=" m³" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="smokeVolume" fill="var(--color-smokeVolume)" fillOpacity={0.16} stroke="var(--color-smokeVolume)" />
                    </ComposedChart>
                  </ChartContainer>
                </ChartCard>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Tidsserie</CardTitle>
                  <CardDescription>Detaljerte verdier per tidssteg for dokumentasjon av scenarioet.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[420px] overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tid</TableHead>
                          <TableHead>Q</TableHead>
                          <TableHead>Røyklagshøyde</TableHead>
                          <TableHead>Røyklagstykkelse</TableHead>
                          <TableHead>Øvre-lag temp.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {simulation.rows.map((row) => (
                          <TableRow key={row.time}>
                            <TableCell>{row.time} s</TableCell>
                            <TableCell>{row.hrr.toLocaleString("nb-NO")} kW</TableCell>
                            <TableCell>{row.smokeLayerHeight.toFixed(2)} m</TableCell>
                            <TableCell>{row.smokeLayerThickness.toFixed(2)} m</TableCell>
                            <TableCell>{row.upperTemp} °C</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <Wind className="h-4 w-4" />
                <AlertTitle>Begrensninger</AlertTitle>
                <AlertDescription>
                  Én sonegeometri / ett rom, ingen detaljert flerromsstrømning, ingen full varmeoverføring til vegger/tak, ingen sprinkleraktivering, ingen toksisitetsberegning og ingen import/eksport av CFAST-input i første versjon.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const NumberField = ({
  label,
  value,
  onChange,
  step = "0.1",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
}) => (
  <div className="grid gap-2">
    <Label>{label}</Label>
    <Input
      type="number"
      value={value}
      min="0"
      step={step}
      onChange={(event) => onChange(toNumber(event.target.value, value))}
    />
  </div>
);

const ChartCard = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export default Brannsimulering;