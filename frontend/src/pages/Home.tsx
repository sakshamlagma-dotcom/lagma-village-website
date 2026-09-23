import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  HeartHandshake,
  Landmark,
  Leaf,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  Sprout,
  Sun,
  Users,
  Waves,
  X,
} from "lucide-react";

interface StatusCheck {
  id: string;
  client_name: string;
  timestamp: string;
}

interface DirectoryContact {
  name: string;
  role: string;
  phone: string;
  icon: typeof Phone;
  tone: string;
}

const fetchStatusChecks = () => apiGet<StatusCheck[]>("/status");

const navItems = [
  ["About", "#about"],
  ["Heritage", "#heritage"],
  ["Landmarks", "#landmarks"],
  ["Updates", "#updates"],
  ["Contact", "#directory"],
] as const;

const stats = [
  ["500+", "years of living heritage", Landmark],
  ["12+", "sacred ponds & temples", Waves],
  ["98%", "literacy drive milestone", BookOpen],
  ["10K+", "residents & diaspora", Users],
] as const;

const landmarks = [
  {
    title: "The village pokhar",
    detail: "A shared place for quiet mornings, Chhath rituals and stories carried across generations.",
    image: "https://images.unsplash.com/photo-1788976864982-094415d2c54e?crop=entropy&cs=srgb&fm=jpg&q=85",
    size: "md:col-span-7 md:row-span-2",
    icon: Waves,
  },
  {
    title: "Shri Hanuman Mandir",
    detail: "A familiar landmark and a steady rhythm in everyday village life.",
    image: "https://images.unsplash.com/photo-1788976864837-42329ba21af1?crop=entropy&cs=srgb&fm=jpg&q=85",
    size: "md:col-span-5",
    icon: Sun,
  },
  {
    title: "Chopal & chaupal",
    detail: "Where neighbours gather, plans take shape and every voice finds a place.",
    image: "https://images.pexels.com/photos/37495850/pexels-photo-37495850.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    size: "md:col-span-5",
    icon: Users,
  },
] as const;

const heritageStories = {
  Festivals: {
    eyebrow: "Rituals & belonging",
    title: "The calendar is a shared memory.",
    body: "From the glow of Chhath at the water’s edge to the colour of Durga Puja, Lagma’s festivals turn familiar streets into places of welcome.",
    image: "https://images.pexels.com/photos/11444459/pexels-photo-11444459.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    tag: "Chhath Puja · Sama Chakeva",
  },
  "Mithila art": {
    eyebrow: "Hands that remember",
    title: "Stories drawn in line and colour.",
    body: "Mithila art keeps the village close: fish, peacocks, vines and sun motifs move from walls to notebooks and into the next generation.",
    image: "https://images.pexels.com/photos/11444459/pexels-photo-11444459.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    tag: "Madhubani · Kohbar",
  },
  "Folk music": {
    eyebrow: "Voices of the soil",
    title: "A song for every season.",
    body: "At weddings, harvests and evening gatherings, folk songs connect the present to the people and places that made Lagma home.",
    image: "https://images.pexels.com/photos/37495850/pexels-photo-37495850.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    tag: "Lok geet · Community nights",
  },
} as const;

const directoryContacts: DirectoryContact[] = [
  { name: "Lagma Panchayat", role: "Civic services & certificates", phone: "+91 6287 440 218", icon: Building2, tone: "bg-[#e8f0e9] text-[#1b4d3e]" },
  { name: "Health & emergency desk", role: "Immediate support and referrals", phone: "+91 9431 220 116", icon: ShieldCheck, tone: "bg-[#f7e6de] text-[#a63e31]" },
  { name: "Youth committee", role: "Sports, events & volunteering", phone: "+91 7766 181 092", icon: HeartHandshake, tone: "bg-[#f6edcf] text-[#8c6517]" },
  { name: "Post office & seva", role: "Letters, forms and local help", phone: "+91 9430 558 241", icon: Phone, tone: "bg-[#e5edf0] text-[#285a69]" },
];

export default function Home() {
  useQuery({ queryKey: ["status"], queryFn: fetchStatusChecks, retry: false });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<keyof typeof heritageStories>("Festivals");
  const [directorySearch, setDirectorySearch] = useState("");

  const filteredContacts = useMemo(
    () => directoryContacts.filter((contact) => `${contact.name} ${contact.role}`.toLowerCase().includes(directorySearch.toLowerCase())),
    [directorySearch],
  );
  const story = heritageStories[activeStory];

  return (
    <div data-testid="lagma-homepage" className="min-h-svh overflow-hidden bg-[#f9f6f0] text-[#1c2421]">
      <header data-testid="header-navbar" className="sticky top-0 z-50 border-b border-emerald-950/10 bg-[#f9f6f0]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-12">
          <a data-testid="brand-logo-link" href="#top" className="group flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#1b4d3e] text-[#f9f6f0] shadow-[0_8px_20px_rgba(27,77,62,0.18)]">
              <Leaf size={20} strokeWidth={1.7} />
              <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#f9f6f0] bg-[#d99b26]" />
            </span>
            <span className="leading-none">
              <span data-testid="brand-name-text" className="block font-[family-name:var(--font-heading)] text-[22px] font-semibold tracking-tight text-[#1b4d3e]">Lagma Village</span>
              <span data-testid="brand-hindi-text" className="mt-1 block font-mono text-[9px] uppercase tracking-[0.22em] text-[#c85a32]">लगमा गाँव · बिहार</span>
            </span>
          </a>
          <nav data-testid="desktop-navigation" className="hidden items-center gap-7 lg:flex">
            {navItems.map(([label, href]) => (
              <a key={label} data-testid={`nav-link-${label.toLowerCase()}`} href={href} className="group relative text-[11px] font-bold uppercase tracking-[0.12em] text-[#52635b] transition-colors duration-200 hover:text-[#c85a32]">
                {label}
                <span className="absolute -bottom-2 left-0 h-px w-0 bg-[#c85a32] transition-all duration-200 group-hover:w-full" />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a data-testid="header-explore-button" href="#landmarks" className="hidden items-center gap-2 rounded-full bg-[#c85a32] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(200,90,50,0.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ae4827] sm:flex">
              Explore village <ArrowRight size={14} />
            </a>
            <button data-testid="mobile-menu-toggle" type="button" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} className="rounded-full border border-[#1b4d3e]/15 p-2.5 text-[#1b4d3e] transition hover:border-[#c85a32] hover:text-[#c85a32] lg:hidden" onClick={() => setMobileMenuOpen((open) => !open)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div data-testid="mobile-navigation" className="border-t border-emerald-950/10 bg-[#fffdf9] px-4 py-4 shadow-lg lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-1 sm:px-4">
              {navItems.map(([label, href]) => (
                <a key={label} data-testid={`mobile-nav-link-${label.toLowerCase()}`} href={href} className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold text-[#1b4d3e] hover:bg-[#f2ece1]" onClick={() => setMobileMenuOpen(false)}>
                  {label}<ChevronRight size={16} className="text-[#c85a32]" />
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <main id="top">
        <section data-testid="hero-section" className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-8 sm:pt-12 lg:px-12 lg:pb-24 lg:pt-16">
          <div className="heritage-frame relative min-h-[590px] overflow-hidden rounded-[28px] bg-[#1b4d3e] shadow-[0_24px_80px_rgba(27,77,62,0.18)]">
            <img data-testid="hero-image" src="https://images.unsplash.com/photo-1788976865623-9e7abbda4d95?crop=entropy&cs=srgb&fm=jpg&q=85" alt="Green fields and a rural landscape around Lagma" className="hero-image-drift absolute inset-0 h-full w-full object-cover opacity-65" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,35,30,0.97)_0%,rgba(20,35,30,0.78)_42%,rgba(20,35,30,0.12)_100%)]" />
            <div className="relative flex min-h-[590px] items-end px-8 py-12 sm:px-14 sm:py-16 lg:max-w-3xl lg:px-20 lg:py-20">
              <div className="animate-float-in">
                <div data-testid="hero-subheading" className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e9b33b]/50 bg-[#d99b26]/15 px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4c665]"><span className="h-1.5 w-1.5 rounded-full bg-[#e9b33b]" /> Heart of Mithila culture</div>
                <h1 data-testid="hero-heading" className="max-w-2xl font-[family-name:var(--font-heading)] text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#fffaf4] sm:text-6xl lg:text-7xl">Where ancient heritage meets <span className="italic text-[#e9b33b]">vibrant living.</span></h1>
                <p data-testid="hero-description" className="mt-7 max-w-xl text-base leading-7 text-[#d7e3dc] sm:text-lg">Lagma is a village of open skies, shared rituals and stories that stay with you. Come discover the people, places and traditions of our home in Bihar.</p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <a data-testid="hero-cta-landmarks" href="#landmarks" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c85a32] px-6 py-3.5 text-sm font-bold text-white transition duration-200 hover:-translate-y-1 hover:bg-[#ae4827]">Explore landmarks <ArrowRight size={16} /></a>
                  <a data-testid="hero-cta-directory" href="#directory" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:bg-white/20">Village directory <ChevronRight size={16} /></a>
                </div>
              </div>
            </div>
            <div data-testid="hero-location-badge" className="absolute bottom-8 right-8 hidden items-center gap-2 rounded-full border border-white/20 bg-[#14231e]/60 px-4 py-2.5 text-xs text-[#f3eee5] backdrop-blur-md sm:flex"><MapPin size={14} className="text-[#e9b33b]" /> Samastipur district, Bihar</div>
          </div>
        </section>

        <section data-testid="village-highlights-section" className="border-y border-[#1b4d3e]/10 bg-[#f2ece1]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-[#1b4d3e]/10 px-4 sm:px-8 md:grid-cols-4 md:divide-y-0 lg:px-12">
            {stats.map(([value, label, Icon]) => (
              <div key={label} data-testid="village-stat-card" className="flex items-center gap-3 px-2 py-6 sm:gap-4 sm:px-5 lg:py-8">
                <Icon data-testid={`stat-icon-${label.replaceAll(" ", "-")}`} size={20} strokeWidth={1.5} className="shrink-0 text-[#c85a32]" />
                <div><div data-testid={`stat-value-${label.replaceAll(" ", "-")}`} className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[#1b4d3e] sm:text-3xl">{value}</div><div data-testid={`stat-label-${label.replaceAll(" ", "-")}`} className="mt-0.5 text-[9px] font-bold uppercase leading-4 tracking-[0.12em] text-[#6b7b74] sm:text-[10px]">{label}</div></div>
              </div>
            ))}
          </div>
        </section>

        <section id="about" data-testid="about-story-container" className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-8 sm:py-28 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-24 lg:px-12">
          <div className="relative pl-5 sm:pl-12">
            <div className="absolute left-0 top-0 h-full w-px bg-[#c85a32]" />
            <div data-testid="about-eyebrow" className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c85a32]">01 / The essence of Lagma</div>
            <h2 data-testid="about-heading" className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-[1.07] tracking-[-0.035em] text-[#1b4d3e] sm:text-5xl">A place that feels like a familiar story.</h2>
            <p data-testid="about-lead" className="mt-6 text-lg leading-8 text-[#3a4742]">Tucked into the fertile heartland of Bihar, Lagma has grown around its ponds, fields and the everyday generosity of its people.</p>
            <p data-testid="about-body" className="mt-4 text-sm leading-7 text-[#6b7b74]">This is a living village, not a page in a history book. It is morning prayers, bicycles on the school road, harvest conversations and a community that keeps finding new ways to care for its home.</p>
            <a data-testid="about-read-more-link" href="#heritage" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#c85a32] transition hover:gap-3">Read our story <ArrowRight size={15} /></a>
          </div>
          <div className="relative grid grid-cols-[1fr_0.78fr] items-end gap-4 sm:gap-6">
            <div data-testid="about-main-image-wrap" className="overflow-hidden rounded-[22px] rounded-br-[70px] bg-[#1b4d3e] shadow-[0_16px_50px_rgba(27,77,62,0.14)]"><img data-testid="about-main-image" src="https://images.pexels.com/photos/39198174/pexels-photo-39198174.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" alt="Lush agricultural fields near the village" className="h-[350px] w-full object-cover transition duration-700 hover:scale-105 sm:h-[460px]" /></div>
            <div className="space-y-4 pb-8 sm:space-y-6 sm:pb-12">
              <div data-testid="about-quote-card" className="rounded-[18px] border border-[#1b4d3e]/10 bg-white p-5 shadow-[0_10px_30px_rgba(27,77,62,0.06)] sm:p-7"><span className="font-[family-name:var(--font-heading)] text-4xl text-[#d99b26]">“</span><p data-testid="about-quote-text" className="mt-1 font-[family-name:var(--font-heading)] text-xl font-semibold leading-tight text-[#1b4d3e]">Our roots run deep, and our welcome runs deeper.</p><span data-testid="about-quote-caption" className="mt-4 block font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#6b7b74]">— A Lagma saying</span></div>
              <div data-testid="about-pokhar-card" className="relative overflow-hidden rounded-[18px] bg-[#c85a32] p-5 text-white sm:p-7"><Waves size={24} className="text-[#f4c665]" /><p data-testid="about-pokhar-text" className="mt-8 font-[family-name:var(--font-heading)] text-2xl font-semibold leading-tight">Every pokhar holds a memory.</p><span data-testid="about-pokhar-label" className="mt-4 block font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#ffe1c2]">Water · worship · community</span></div>
            </div>
          </div>
        </section>

        <section id="landmarks" data-testid="landmarks-section" className="bg-[#1b4d3e] px-4 py-20 text-[#f9f6f0] sm:px-8 sm:py-28 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div><div data-testid="landmarks-eyebrow" className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#e9b33b]">02 / Places with a pulse</div><h2 data-testid="landmarks-heading" className="mt-4 max-w-xl font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">The landmarks we carry with us.</h2></div>
              <p data-testid="landmarks-intro" className="max-w-xs text-sm leading-6 text-[#b8cbc0]">Start with the places that make Lagma feel instantly like home.</p>
            </div>
            <div data-testid="landmarks-bento-grid" className="mt-12 grid gap-4 md:grid-cols-12 md:grid-rows-[260px_210px]">
              {landmarks.map(({ title, detail, image, size, icon: Icon }, index) => (
                <a key={title} data-testid="landmark-card-item" href="#directory" className={`group relative min-h-[260px] overflow-hidden rounded-[18px] border border-white/10 ${size}`}>
                  <img data-testid={`landmark-image-${index + 1}`} src={image} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-85" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d211a] via-[#0d211a]/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8"><div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#d99b26] text-[#1c2421]"><Icon size={17} /></div><h3 data-testid={`landmark-title-${index + 1}`} className="font-[family-name:var(--font-heading)] text-2xl font-semibold">{title}</h3><p data-testid={`landmark-detail-${index + 1}`} className="mt-2 max-w-md text-xs leading-5 text-[#d5e0da]">{detail}</p></div>
                  <ChevronRight data-testid={`landmark-arrow-${index + 1}`} size={20} className="absolute right-6 top-6 text-[#f4c665] transition group-hover:translate-x-1" />
                </a>
              ))}
              <div data-testid="landmark-directory-card" className="flex items-center justify-between rounded-[18px] border border-[#d99b26]/30 bg-[#27483b] p-6 md:col-span-5"><div><Sprout size={22} className="text-[#d99b26]" /><p data-testid="landmark-directory-text" className="mt-4 max-w-[200px] font-[family-name:var(--font-heading)] text-xl font-semibold">There is more to discover.</p></div><a data-testid="landmark-directory-link" href="#directory" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c85a32] text-white transition hover:scale-105"><ArrowRight size={17} /></a></div>
            </div>
          </div>
        </section>

        <section id="heritage" data-testid="heritage-art-section" className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
            <div><div data-testid="heritage-eyebrow" className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c85a32]">03 / Culture & craft</div><h2 data-testid="heritage-heading" className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight tracking-[-0.03em] text-[#1b4d3e] sm:text-5xl">Made by hand, remembered by heart.</h2><p data-testid="heritage-intro" className="mt-6 text-sm leading-7 text-[#6b7b74]">Lagma’s culture lives in what we make, sing and celebrate together. Select a thread to follow.</p><div data-testid="heritage-tab-list" className="mt-8 flex flex-wrap gap-2">
              {(Object.keys(heritageStories) as Array<keyof typeof heritageStories>).map((tab) => <button key={tab} data-testid={`festival-tab-button-${tab.toLowerCase().replace(" ", "-")}`} type="button" onClick={() => setActiveStory(tab)} className={`rounded-full border px-4 py-2 text-xs font-bold transition ${activeStory === tab ? "border-[#1b4d3e] bg-[#1b4d3e] text-white" : "border-[#1b4d3e]/15 bg-white text-[#52635b] hover:border-[#c85a32] hover:text-[#c85a32]"}`}>{tab}</button>)}
            </div></div>
            <div data-testid="heritage-story-card" className="grid overflow-hidden rounded-[24px] bg-[#f2ece1] md:grid-cols-[0.9fr_1.1fr]"><div className="relative min-h-[300px] overflow-hidden"><img data-testid="heritage-story-image" src={story.image} alt={story.title} className="absolute inset-0 h-full w-full object-cover transition duration-500" /><div className="absolute inset-0 bg-gradient-to-t from-[#14231e]/60 to-transparent" /><div data-testid="heritage-story-tag" className="absolute bottom-5 left-5 rounded-full bg-[#f9f6f0]/90 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-[#1b4d3e]">{story.tag}</div></div><div className="flex flex-col justify-center p-7 sm:p-10"><div data-testid="heritage-story-eyebrow" className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#c85a32]">{story.eyebrow}</div><h3 data-testid="heritage-story-title" className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight text-[#1b4d3e]">{story.title}</h3><p data-testid="heritage-story-body" className="mt-5 text-sm leading-7 text-[#6b7b74]">{story.body}</p><a data-testid="heritage-story-link" href="#updates" className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1b4d3e] transition hover:gap-3">See village stories <ArrowRight size={14} className="text-[#c85a32]" /></a></div></div>
          </div>
        </section>

        <section id="updates" data-testid="community-news-section" className="border-y border-[#1b4d3e]/10 bg-[#fffdf9] px-4 py-20 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div data-testid="updates-eyebrow" className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c85a32]">04 / Around the village</div><h2 data-testid="updates-heading" className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-[-0.03em] text-[#1b4d3e] sm:text-5xl">Notes from Lagma.</h2></div><a data-testid="updates-view-all-link" href="#directory" className="inline-flex items-center gap-2 text-sm font-bold text-[#c85a32]">View community board <ArrowRight size={15} /></a></div><div data-testid="community-news-feed" className="mt-10 grid gap-4 md:grid-cols-3">
            {[{ category: "Community", title: "The pond clean-up brought three generations together", date: "12 March 2025", icon: Waves }, { category: "Education", title: "A new reading corner opens at the primary school", date: "04 March 2025", icon: BookOpen }, { category: "Festival", title: "Sama Chakeva: a night of songs, stories and sisterhood", date: "22 February 2025", icon: CalendarDays }].map(({ category, title, date, icon: Icon }, index) => <article key={title} data-testid="news-feed-item" className="group rounded-[18px] border border-[#1b4d3e]/10 bg-[#f9f6f0] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#c85a32]/35 hover:shadow-[0_14px_35px_rgba(27,77,62,0.08)]"><div className="flex items-center justify-between"><span data-testid={`news-category-${index + 1}`} className="rounded-full bg-[#e8f0e9] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-[#1b4d3e]">{category}</span><Icon data-testid={`news-icon-${index + 1}`} size={19} className="text-[#c85a32]" /></div><h3 data-testid={`news-title-${index + 1}`} className="mt-8 font-[family-name:var(--font-heading)] text-2xl font-semibold leading-tight text-[#1b4d3e]">{title}</h3><div className="mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#6b7b74]"><Clock3 size={14} className="text-[#d99b26]" /> <span data-testid={`news-date-${index + 1}`}>{date}</span></div></article>)}
          </div></div>
        </section>

        <section id="directory" data-testid="directory-section" className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28 lg:px-12"><div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start lg:gap-24"><div><div data-testid="directory-eyebrow" className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c85a32]">05 / People who can help</div><h2 data-testid="directory-heading" className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight tracking-[-0.03em] text-[#1b4d3e] sm:text-5xl">Your village, closer.</h2><p data-testid="directory-intro" className="mt-6 text-sm leading-7 text-[#6b7b74]">Find the right person, service or community desk for your next question.</p><div className="relative mt-8"><Search data-testid="directory-search-icon" size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7b74]" /><input data-testid="directory-search-input" value={directorySearch} onChange={(event) => setDirectorySearch(event.target.value)} placeholder="Search the directory" className="h-12 w-full rounded-full border border-[#1b4d3e]/15 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#94a39d] focus:border-[#c85a32] focus:ring-2 focus:ring-[#c85a32]/10" /></div><div data-testid="directory-helper" className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#6b7b74]"><MapPin size={15} className="mt-0.5 shrink-0 text-[#d99b26]" /> Local contacts for everyday help, civic services and community care.</div></div><div data-testid="directory-contact-list" className="grid gap-3 sm:grid-cols-2">{filteredContacts.map(({ name, role, phone, icon: Icon, tone }, index) => <a data-testid="directory-contact-card" key={name} href={`tel:${phone.replaceAll(" ", "")}`} className="group flex items-start gap-4 rounded-[18px] border border-[#1b4d3e]/10 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[#c85a32]/30 hover:shadow-[0_12px_30px_rgba(27,77,62,0.07)]"><span data-testid={`directory-icon-${index + 1}`} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon size={19} /></span><span className="min-w-0"><span data-testid={`directory-name-${index + 1}`} className="block font-[family-name:var(--font-heading)] text-xl font-semibold text-[#1b4d3e]">{name}</span><span data-testid={`directory-role-${index + 1}`} className="mt-1 block text-xs text-[#6b7b74]">{role}</span><span data-testid={`directory-phone-${index + 1}`} className="mt-4 flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wide text-[#c85a32]">{phone} <ArrowRight size={12} className="transition group-hover:translate-x-1" /></span></span></a>)}{filteredContacts.length === 0 && <div data-testid="directory-empty-state" className="rounded-[18px] border border-dashed border-[#1b4d3e]/20 p-8 text-center text-sm text-[#6b7b74] sm:col-span-2">No contacts match that search. Try “health” or “panchayat”.</div>}</div></div></section>
      </main>

      <footer data-testid="footer-container" className="bg-[#14231e] px-4 pb-8 pt-16 text-[#e2ece8] sm:px-8 sm:pt-20 lg:px-12"><div className="mx-auto max-w-7xl"><div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.25fr_0.75fr_0.75fr_1fr]"><div><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d99b26] text-[#1c2421]"><Leaf size={20} /></span><span data-testid="footer-brand-text" className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-white">Lagma Village</span></div><p data-testid="footer-quote" className="mt-6 max-w-sm font-[family-name:var(--font-heading)] text-2xl leading-tight text-[#e9b33b]">“A village is not just a place. It is a promise we keep for one another.”</p></div><div><div data-testid="footer-explore-heading" className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#e9b33b]">Explore</div><div className="mt-5 grid gap-3">{navItems.slice(0, 4).map(([label, href]) => <a key={label} data-testid={`footer-link-${label.toLowerCase()}`} href={href} className="w-fit text-sm text-[#b8cbc0] transition hover:text-white">{label}</a>)}</div></div><div><div data-testid="footer-help-heading" className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#e9b33b]">Need help?</div><div className="mt-5 grid gap-3"><a data-testid="footer-panchayat-link" href="tel:+916287440218" className="flex items-center gap-2 text-sm text-[#b8cbc0] transition hover:text-white"><Phone size={13} /> Panchayat desk</a><a data-testid="footer-map-link" href="#landmarks" className="flex items-center gap-2 text-sm text-[#b8cbc0] transition hover:text-white"><MapPin size={13} /> Village landmarks</a></div></div><div data-testid="footer-civic-note" className="rounded-[16px] border border-white/10 bg-[#1b332a] p-5"><div className="flex items-center gap-2 text-[#e9b33b]"><HeartHandshake size={18} /><span data-testid="footer-civic-heading" className="font-bold">Built by the community</span></div><p data-testid="footer-civic-text" className="mt-3 text-xs leading-5 text-[#b8cbc0]">A growing digital home for Lagma residents, families and friends everywhere.</p></div></div><div className="flex flex-col justify-between gap-3 pt-7 text-[10px] font-bold uppercase tracking-[0.12em] text-[#81988b] sm:flex-row"><span data-testid="footer-copyright-text">© 2025 Lagma Village Community</span><span data-testid="footer-location-text">Samastipur · Bihar · India</span></div></div></footer>
    </div>
  );
}
