import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit3, Save, Mail, Linkedin, Github, ExternalLink, Download } from "lucide-react";
import MD5 from "crypto-js/md5";
import { toast } from "sonner";
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, onValue, ref, set } from "firebase/database";
import { firebaseConfig } from "@/integrations/firebase/config";

// Editable content types
interface Project { title: string; url: string; description?: string }
interface Certification { title: string; issuer?: string }
interface PortfolioContent {
  name: string;
  tagline: string;
  about: string;
  skills: string[];
  projects: Project[];
  certifications: Certification[];
  contact: {
    email: string;
    linkedin: string;
    github: string;
    resumeUrl: string;
  };
  profileImage: string; // data URL
}

const DEFAULT_CONTENT: PortfolioContent = {
  name: "Thanushpriyan",
  tagline: "Final Year B.Tech – Artificial Intelligence & Data Science",
  about:
    "I am a passionate AI & Data Science student with hands-on experience in building intelligent systems and IoT solutions. I love solving real-world problems using data-driven approaches and rapid prototyping.",
  skills: ["Python, Numpy, Pandas", "Machine Learning", "ESP32 & IoT"],
  projects: [
    {
      title: "Women’s Safety Watch – Real-time alert system",
      url: "#",
      description: "A real-time wearable/IoT alert system designed for safety and rapid response.",
    },
    {
      title: "Face Recognition System – Attendance using Streamlit",
      url: "#",
      description: "Automated attendance app with face recognition, built using Streamlit.",
    },
  ],
  certifications: [
    { title: "Google Data Analytics – Coursera", issuer: "Coursera" },
  ],
  contact: {
    email: "mailto:thanush@example.com",
    linkedin: "https://www.linkedin.com/in/thanush/",
    github: "https://github.com/thanush",
    resumeUrl: "#",
  },
  profileImage: "/placeholder.svg",
};

// MD5 hash of the edit password. Default password: "edit123"
const EDIT_HASH = "ed9c6b8a1c5b4f040b0a1b85110f891b"; // md5('edit123')

const isFirebaseConfigured = Boolean(
  (firebaseConfig as any)?.apiKey && (firebaseConfig as any)?.databaseURL
);

const Index = () => {
  const [content, setContent] = useState<PortfolioContent>(DEFAULT_CONTENT);
  const [isEditing, setIsEditing] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize Firebase only if configured
  const db = useMemo(() => {
    try {
      if (!isFirebaseConfigured) return null;
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      return getDatabase(app);
    } catch (e) {
      console.error("Firebase init error", e);
      return null;
    }
  }, []);

  // Load content (Firebase if configured, else localStorage)
  useEffect(() => {
    if (db) {
      const r = ref(db, "portfolio");
      return onValue(r, (snapshot) => {
        const data = snapshot.val() as PortfolioContent | null;
        if (data) setContent(data);
      });
    }
    // Fallback to localStorage
    const cached = localStorage.getItem("portfolio-content");
    if (cached) setContent(JSON.parse(cached));
  }, [db]);

  const saveContent = async () => {
    try {
      if (db) {
        await set(ref(db, "portfolio"), content);
        toast.success("Content saved to Firebase");
      } else {
        localStorage.setItem("portfolio-content", JSON.stringify(content));
        toast.success("Content saved locally (configure Firebase to sync)");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save content");
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      setIsEditing(false);
      return;
    }
    if (isAuthorized) {
      setIsEditing(true);
      return;
    }
    const input = window.prompt("Enter edit password");
    if (input == null) return;
    const hash = MD5(input).toString();
    if (hash === EDIT_HASH) {
      setIsAuthorized(true);
      setIsEditing(true);
      toast.success("Edit mode enabled");
    } else {
      toast.error("Incorrect password");
    }
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setContent((c) => ({ ...c, profileImage: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  const EditableSpan = ({
    value,
    onChange,
    className,
    as: As = "span",
  }: {
    value: string;
    onChange: (v: string) => void;
    className?: string;
    as?: any;
  }) => (
    <As
      suppressContentEditableWarning
      contentEditable={isEditing}
      className={className}
      onInput={(e: any) => onChange(e.currentTarget.textContent)}
    >
      {value}
    </As>
  );

  return (
    <div>
      <header className="bg-header-gradient">
        <nav className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="#home" className="font-semibold tracking-wide">TPR</a>
            <div className="hidden sm:flex gap-6 text-sm">
              {[
                { href: "#about", label: "About" },
                { href: "#skills", label: "Skills" },
                { href: "#projects", label: "Projects" },
                { href: "#certifications", label: "Certifications" },
                { href: "#contact", label: "Contact" },
              ].map((l) => (
                <a key={l.href} href={l.href} className="story-link">
                  {l.label}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={toggleEdit} className="hover-scale" variant="secondary">
                <Edit3 className="mr-2 h-4 w-4" /> {isEditing ? "Close" : "Edit"}
              </Button>
              {isEditing && (
                <Button size="sm" onClick={saveContent} className="hover-scale">
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
              )}
            </div>
          </div>
        </nav>
        <div id="home" className="max-w-5xl mx-auto px-4 pt-12 pb-10 text-center">
          <div className="relative inline-block">
            <img
              src={content.profileImage}
              alt="Thanush Priyan R profile"
              loading="lazy"
              className="mx-auto h-36 w-36 sm:h-44 sm:w-44 rounded-full ring-2 ring-primary/70 glow-ring object-cover select-none hover-scale"
            />
            {isEditing && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onImageChange}
                />
                <Button size="sm" variant="secondary" className="hover-scale" onClick={() => fileInputRef.current?.click()}>
                  Change Photo
                </Button>
              </div>
            )}
          </div>
          <h1 className="mt-6 text-3xl sm:text-4xl font-bold">
            <EditableSpan value={content.name} onChange={(v) => setContent((c) => ({ ...c, name: v }))} as="span" />
          </h1>
          <p className="mt-2 text-muted-foreground">
            <EditableSpan value={content.tagline} onChange={(v) => setContent((c) => ({ ...c, tagline: v }))} as="span" />
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <a href={content.contact.resumeUrl} download className="inline-flex">
              <Button className="hover-scale">
                <Download className="mr-2 h-4 w-4" /> Download Resume
              </Button>
            </a>
            <a href="#contact" className="inline-flex">
              <Button variant="secondary" className="hover-scale">
                <Mail className="mr-2 h-4 w-4" /> Contact
              </Button>
            </a>
          </div>
          {!isFirebaseConfigured && (
            <div className="mt-4 text-xs text-muted-foreground">
              Tip: Configure Firebase to enable cloud sync.
            </div>
          )}
        </div>
      </header>

      <main>
        {/* About */}
        <section id="about" className="scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-xl font-semibold border-l-4 pl-3 border-primary">About</h2>
            <p className="mt-4 leading-relaxed">
              <EditableSpan value={content.about} onChange={(v) => setContent((c) => ({ ...c, about: v }))} as="span" />
            </p>
          </div>
        </section>

        {/* Skills */}
        <section id="skills" className="scroll-mt-24 bg-secondary/40">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-xl font-semibold border-l-4 pl-3 border-primary">Skills</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {content.skills.map((s, idx) => (
                <span key={idx} className="px-3 py-1 rounded-full bg-secondary text-foreground/90">
                  <EditableSpan
                    value={s}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        skills: c.skills.map((x, i) => (i === idx ? v : x)),
                      }))
                    }
                    as="span"
                  />
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Projects */}
        <section id="projects" className="scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-xl font-semibold border-l-4 pl-3 border-primary">Projects</h2>
            <div className="mt-6 grid sm:grid-cols-2 gap-6">
              {content.projects.map((p, idx) => (
                <article key={idx} className="rounded-lg border border-border bg-card/50 p-5 hover-scale">
                  <h3 className="text-lg font-semibold">
                    <EditableSpan
                      value={p.title}
                      onChange={(v) =>
                        setContent((c) => ({
                          ...c,
                          projects: c.projects.map((x, i) => (i === idx ? { ...x, title: v } : x)),
                        }))
                      }
                      as="span"
                    />
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <EditableSpan
                      value={p.description || ""}
                      onChange={(v) =>
                        setContent((c) => ({
                          ...c,
                          projects: c.projects.map((x, i) => (i === idx ? { ...x, description: v } : x)),
                        }))
                      }
                      as="span"
                    />
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <a className="story-link inline-flex items-center gap-2" href={p.url} target="_blank" rel="noreferrer">
                      View <ExternalLink className="h-4 w-4" />
                    </a>
                    {isEditing && (
                      <input
                        className="bg-secondary px-2 py-1 rounded text-xs w-1/2"
                        value={p.url}
                        onChange={(e) =>
                          setContent((c) => ({
                            ...c,
                            projects: c.projects.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)),
                          }))
                        }
                        placeholder="https://..."
                      />
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section id="certifications" className="scroll-mt-24 bg-secondary/40">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-xl font-semibold border-l-4 pl-3 border-primary">Certifications</h2>
            <ul className="mt-4 space-y-3">
              {content.certifications.map((c, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                  <span className="font-medium">
                    <EditableSpan
                      value={c.title}
                      onChange={(v) =>
                        setContent((s) => ({
                          ...s,
                          certifications: s.certifications.map((x, i) => (i === idx ? { ...x, title: v } : x)),
                        }))
                      }
                      as="span"
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-xl font-semibold border-l-4 pl-3 border-primary">Contact</h2>
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <a href={content.contact.email} className="flex items-center gap-3 rounded-md border border-border p-4 hover-scale">
                <Mail className="h-5 w-5" /> Email
              </a>
              <a href={content.contact.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-md border border-border p-4 hover-scale">
                <Linkedin className="h-5 w-5" /> LinkedIn
              </a>
              <a href={content.contact.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-md border border-border p-4 hover-scale">
                <Github className="h-5 w-5" /> GitHub
              </a>
              <a href={content.contact.resumeUrl} className="flex items-center gap-3 rounded-md border border-border p-4 hover-scale">
                <Download className="h-5 w-5" /> Resume
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Thanushpriyan</p>
          <p className="mt-1">Built with 💻 in Trichy.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
