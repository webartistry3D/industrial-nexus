'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Box,
  CheckCircle,
  Clock,
  Compass,
  Container,
  Eye,
  FileText,
  Globe,
  LayoutDashboard,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Menu,
  Package,
  Phone,
  Scale,
  Shield,
  ShieldCheck,
  Smartphone,
  Truck,
  Users,
  X,
  Zap,
} from 'lucide-react';

// Utility
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Animated counter
function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    let raf: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isInView, end, duration]);

  return { count, ref };
}

// Section wrapper
function Section({
  children,
  className,
  id,
  dark = false,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        'section-padding py-20 lg:py-28',
        dark && 'bg-navy-950 text-white',
        className
      )}
    >
      {children}
    </section>
  );
}

// Navigation
function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { label: 'Platform', href: '#solution' },
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Corridor', href: '#corridor' },
    { label: 'Security', href: '#security' },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-white/90 backdrop-blur-lg border-b border-slate-200 py-3' : 'bg-transparent py-5'
      )}
    >
      <div className="container-wide flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-bold text-xl tracking-tight text-navy-950">
          <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          Industrial Nexus
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-navy-900 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="#contact"
            className="text-sm font-medium text-slate-700 hover:text-navy-900 transition-colors"
          >
            Contact Sales
          </a>
          <a
            href="#demo"
            className="px-4 py-2 text-sm font-semibold text-white bg-navy-900 rounded-lg hover:bg-navy-800 transition-colors"
          >
            Request Demo
          </a>
        </div>

        <button
          className="md:hidden p-2 text-slate-700"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 py-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium text-slate-700"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#demo"
            className="block mt-3 px-4 py-2 text-center text-sm font-semibold text-white bg-navy-900 rounded-lg"
          >
            Request Demo
          </a>
        </div>
      )}
    </nav>
  );
}

// Hero dashboard mockup
function HeroDashboard() {
  return (
    <div className="relative w-full max-w-2xl mx-auto lg:mx-0">
      <div className="absolute -inset-4 bg-gradient-to-r from-industrial-blue/20 to-industrial-electric/20 rounded-3xl blur-3xl opacity-60" />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="ml-auto text-xs text-slate-500 font-medium">Control Tower</div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Active Trips', value: '24', color: 'text-industrial-blue' },
              { label: 'On Time', value: '96%', color: 'text-industrial-green' },
              { label: 'Alerts', value: '3', color: 'text-industrial-orange' },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className={cn('text-2xl font-bold', stat.color)}>{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-slate-100 rounded-xl h-48 mb-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <svg className="w-full h-full" viewBox="0 0 400 200">
                <path
                  d="M20 160 Q 100 120 180 140 T 340 80"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeDasharray="8 4"
                />
                <circle cx="40" cy="150" r="6" fill="#2563eb" />
                <circle cx="180" cy="140" r="6" fill="#f97316" />
                <circle cx="340" cy="80" r="8" fill="#10b981" />
              </svg>
            </div>
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-industrial-orange" />
              Ikeja → Agbara
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-industrial-electric" />
              Live Tracking
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Fleet online
            </div>
            <div>Last updated: just now</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hero
function Hero() {
  return (
    <section className="relative section-padding pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-industrial-blue/10 to-transparent rounded-full blur-3xl opacity-60" />
      </div>
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-2xl"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-50 border border-navy-100 text-xs font-semibold text-navy-800 mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-industrial-green animate-pulse" />
              Operational Infrastructure for Industrial Logistics
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy-950 leading-[1.1] mb-6"
            >
              Industrial Logistics Without{' '}
              <span className="text-industrial-blue">Operational Downtime</span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-slate-600 leading-relaxed mb-8"
            >
              Industrial Nexus is a specialized logistics execution platform that enables
              manufacturers and industrial suppliers to move critical consumables with
              real-time visibility, intelligent dispatching, and operational discipline.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 mb-10">
              <a
                href="#demo"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-navy-900 rounded-xl hover:bg-navy-800 transition-colors shadow-lg shadow-navy-900/20"
              >
                Request a Demo
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#solution"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-navy-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Explore Platform
              </a>
            </motion.div>
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 text-sm text-slate-500">
              {[
                { icon: Eye, label: 'Real-Time Tracking' },
                { icon: ShieldCheck, label: 'Industrial SOP Compliance' },
                { icon: Zap, label: 'Event-Driven Visibility' },
                { icon: Scale, label: 'Weight Watch Validation' },
                { icon: Shield, label: 'Enterprise Security' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-industrial-blue" />
                  {item.label}
                </div>
              ))}
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <HeroDashboard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Problem section
function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const painPoints = [
    { icon: Clock, title: 'Production Downtime', desc: 'Idle lines waiting for consumables that never arrive on schedule.' },
    { icon: Eye, title: 'Poor Shipment Visibility', desc: 'No real-time insight into where critical cargo is located.' },
    { icon: Package, title: 'Late Deliveries', desc: 'Missed windows that cascade into delayed production and lost revenue.' },
    { icon: Box, title: 'Wrong Cargo Handling', desc: 'Incompatible items mixed, causing damage and safety risks.' },
    { icon: Users, title: 'Manual Dispatch', desc: 'Phone calls and spreadsheets slow decision-making and create errors.' },
    { icon: FileText, title: 'No Accountability', desc: 'Disputes over delivery status without proof or audit trail.' },
    { icon: Container, title: 'Cargo Damage', desc: 'Improper loading and handling lead to costly write-offs.' },
    { icon: Phone, title: 'Delivery Disputes', desc: 'Clients and suppliers arguing over what was delivered when.' },
  ];

  return (
    <Section id="problem">
      <div className="container-wide">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-950 mb-4">
            Industrial Logistics Shouldn't Be Guesswork
          </h2>
          <p className="text-lg text-slate-600">
            Manufacturers across the corridor still operate with fragmented visibility,
            manual coordination, and reactive problem solving.
          </p>
        </div>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {painPoints.map((point) => (
            <motion.div
              key={point.title}
              variants={fadeInUp}
              className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-industrial-blue/30 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
                <point.icon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-navy-950 mb-2">{point.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{point.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// Solution section
function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const steps = [
    { label: 'Order Created', color: 'bg-navy-900' },
    { label: 'Kitting', color: 'bg-navy-800' },
    { label: 'Weight Watch Validation', color: 'bg-industrial-blue' },
    { label: 'Driver Assignment', color: 'bg-industrial-electric' },
    { label: 'Real-Time Tracking', color: 'bg-industrial-orange' },
    { label: 'Event-Driven Geofencing', color: 'bg-industrial-green' },
    { label: 'Digital Proof of Delivery', color: 'bg-navy-700' },
    { label: 'Performance Analytics', color: 'bg-navy-600' },
  ];

  return (
    <Section id="solution" className="bg-slate-50">
      <div className="container-wide">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-950 mb-4">
            A Logistics Platform Built for Industry
          </h2>
          <p className="text-lg text-slate-600">
            Industrial Nexus transforms fragmented logistics operations into one intelligent
            operational network.
          </p>
        </div>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.label}
                variants={fadeInUp}
                className="flex items-center gap-4"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm shrink-0 shadow-md">
                  <div className={cn('w-full h-full rounded-full flex items-center justify-center', step.color)}>
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 bg-white rounded-xl px-5 py-4 border border-slate-200 shadow-sm">
                  <span className="font-semibold text-navy-950">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// Features section
function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const features = [
    {
      icon: Scale,
      title: 'Weight Watch Engine',
      desc: 'Automatically validates vehicle capacity, cargo compatibility, and handling requirements before dispatch.',
      color: 'bg-industrial-blue/10 text-industrial-blue',
    },
    {
      icon: LocateFixed,
      title: 'Event-Driven Geofencing',
      desc: 'Receive intelligent operational alerts as shipments enter multi-radius and polygon geofences.',
      color: 'bg-industrial-orange/10 text-industrial-orange',
    },
    {
      icon: Container,
      title: 'Technical Logistics Hub',
      desc: 'Track industrial consumables through aggregation, technical packaging, quality checks, and dispatch.',
      color: 'bg-industrial-electric/10 text-industrial-electric',
    },
    {
      icon: LayoutDashboard,
      title: 'Control Tower Dashboard',
      desc: 'Monitor every shipment from a centralized operational dashboard.',
      color: 'bg-navy-900/10 text-navy-900',
    },
    {
      icon: Smartphone,
      title: 'Digital Proof of Delivery',
      desc: 'Capture photo, signature, timestamp, and GPS verification.',
      color: 'bg-industrial-green/10 text-industrial-green',
    },
    {
      icon: CheckCircle,
      title: 'Industrial SOP Engine',
      desc: 'Ensure standardized logistics procedures are followed for every shipment.',
      color: 'bg-purple-500/10 text-purple-600',
    },
  ];

  return (
    <Section id="features">
      <div className="container-wide">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-950 mb-4">Platform Capabilities</h2>
          <p className="text-lg text-slate-600">
            Purpose-built modules that enforce operational discipline at every logistics milestone.
          </p>
        </div>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              className="p-6 bg-white rounded-2xl border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', feature.color)}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-navy-950 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// How it works
function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const steps = [
    { icon: FileText, title: 'Create Order', desc: 'Capture cargo details, handling requirements, and delivery windows.' },
    { icon: Box, title: 'Technical Kitting', desc: 'Aggregate, package, and label items according to SOP.' },
    { icon: Scale, title: 'Weight Validation', desc: 'Match cargo to vehicle capacity and handling compatibility.' },
    { icon: Truck, title: 'Dispatch', desc: 'Assign drivers and vehicles based on availability and route.' },
    { icon: MapIcon, title: 'Live Tracking', desc: 'Monitor location, speed, and route progress in real time.' },
    { icon: CheckCircle, title: 'Verified Delivery', desc: 'Confirm delivery with digital POD and timestamp.' },
  ];

  return (
    <Section id="how-it-works" className="bg-slate-50">
      <div className="container-wide">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-950 mb-4">How It Works</h2>
          <p className="text-lg text-slate-600">
            A disciplined workflow from order creation to verified delivery.
          </p>
        </div>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              variants={fadeInUp}
              className="relative p-6 bg-white rounded-2xl border border-slate-200"
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center text-sm font-bold shadow-md">
                {index + 1}
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 text-navy-900">
                <step.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-navy-950 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// Platform showcase
function ShowcaseSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const platforms = [
    {
      title: 'Admin Control Tower',
      desc: 'Centralized command for operations, fleet, orders, and analytics.',
      color: 'from-navy-900 to-navy-800',
      items: ['Live fleet map', 'Order lifecycle', 'Driver management', 'KPI dashboards'],
    },
    {
      title: 'Driver PWA',
      desc: 'Mobile-first experience for trip execution, SOP checklists, and POD.',
      color: 'from-industrial-blue to-industrial-electric',
      items: ['Trip assignments', 'Route navigation', 'SOP checklist', 'Digital POD'],
    },
    {
      title: 'Client Portal',
      desc: 'Self-service visibility for manufacturers and suppliers.',
      color: 'from-industrial-orange to-amber-500',
      items: ['Order creation', 'Real-time tracking', 'Delivery history', 'Invoice view'],
    },
  ];

  return (
    <Section id="showcase">
      <div className="container-wide">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-950 mb-4">Three Interfaces, One Network</h2>
          <p className="text-lg text-slate-600">
            Purpose-built portals for every stakeholder in the logistics chain.
          </p>
        </div>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid lg:grid-cols-3 gap-8"
        >
          {platforms.map((platform) => (
            <motion.div
              key={platform.title}
              variants={fadeInUp}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <div className={cn('h-3 bg-gradient-to-r', platform.color)} />
              <div className="p-6">
                <div className="bg-slate-100 rounded-xl h-40 mb-6 relative overflow-hidden border border-slate-200">
                  <div className={cn('absolute inset-0 opacity-10 bg-gradient-to-br', platform.color)} />
                  <div className="absolute inset-4 bg-white rounded-lg shadow-sm border border-slate-200">
                    <div className="h-3 bg-slate-50 border-b border-slate-100 flex items-center px-2 gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2">
                      <div className="h-8 bg-slate-100 rounded" />
                      <div className="h-8 bg-slate-100 rounded" />
                      <div className="h-8 bg-slate-100 rounded col-span-2" />
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-navy-950 mb-2">{platform.title}</h3>
                <p className="text-slate-600 mb-4">{platform.desc}</p>
                <ul className="space-y-2">
                  {platform.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-industrial-green" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// KPI card
function KpiCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCountUp(value, 2000);
  return (
    <div ref={ref} className="text-center p-8 bg-white rounded-2xl border border-slate-200">
      <div className="text-5xl sm:text-6xl font-extrabold text-navy-900 mb-2">
        {count}
        {suffix}
      </div>
      <div className="text-slate-600 font-medium">{label}</div>
    </div>
  );
}

function KpiSection() {
  return (
    <Section className="bg-navy-950 text-white">
      <div className="container-wide">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Operational Excellence, by the Numbers</h2>
          <p className="text-lg text-slate-400">
            Targets driven by disciplined process execution and real-time visibility.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard value={98} suffix="%" label="Target On-Time Delivery" />
          <KpiCard value={1} suffix="%" label="Transit Damage Goal" />
          <KpiCard value={100} suffix="%" label="Driver SOP Compliance" />
          <KpiCard value={40} suffix="%" label="Lead Time Reduction Target" />
        </div>
      </div>
    </Section>
  );
}

// Industrial corridor
function CorridorSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const locations = [
    'Ikeja',
    'Apapa',
    'Agbara',
    'Sagamu',
    'Ota',
    'Lekki Free Trade Zone',
    'Flowergate',
    'Ogun Guangdong FTZ',
  ];

  return (
    <Section id="corridor" className="bg-slate-50">
      <div className="container-wide">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-950 mb-4">
            Serving the Lagos–Ogun Industrial Corridor
          </h2>
          <p className="text-lg text-slate-600">
            Connecting industrial estates, free trade zones, and manufacturing clusters across Nigeria's most critical logistics corridor.
          </p>
        </div>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7 }}
          className="relative bg-white rounded-3xl border border-slate-200 p-6 lg:p-10 overflow-hidden"
        >
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
              <path
                d="M 120 280 Q 250 200 400 220 T 680 120"
                fill="none"
                stroke="#2563eb"
                strokeWidth="4"
                strokeDasharray="12 8"
                className="animate-[dash_20s_linear_infinite]"
              />
              <path
                d="M 80 150 Q 300 280 500 180 T 720 240"
                fill="none"
                stroke="#f97316"
                strokeWidth="3"
                strokeDasharray="8 6"
              />
              <path
                d="M 200 80 Q 400 150 600 100 T 750 160"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="3"
                strokeDasharray="10 6"
              />
            </svg>
          </div>
          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-4">
            {locations.map((loc, index) => (
              <motion.div
                key={loc}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="flex items-center gap-3 bg-white/90 backdrop-blur border border-slate-200 rounded-xl px-4 py-3 shadow-sm"
              >
                <MapPin className="w-5 h-5 text-industrial-blue shrink-0" />
                <span className="text-sm font-semibold text-navy-950">{loc}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// Why us
function WhyUsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const rows = [
    { feature: 'Industrial SOPs', us: true, them: false },
    { feature: 'Weight Validation', us: true, them: false },
    { feature: 'Live Visibility', us: true, them: 'Partial' },
    { feature: 'Operational Control', us: true, them: false },
    { feature: 'Digital POD', us: true, them: false },
    { feature: 'Geofencing', us: true, them: false },
    { feature: 'Analytics', us: true, them: 'Limited' },
    { feature: 'Dispatch Intelligence', us: true, them: false },
  ];

  return (
    <Section id="why-us">
      <div className="container-wide">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-950 mb-4">Why Industrial Nexus</h2>
          <p className="text-lg text-slate-600">
            Operational infrastructure versus traditional logistics coordination.
          </p>
        </div>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-navy-950">
            <div className="px-6 py-4">Capability</div>
            <div className="px-6 py-4 text-center">Industrial Nexus</div>
            <div className="px-6 py-4 text-center">Traditional Logistics</div>
          </div>
          {rows.map((row, index) => (
            <div
              key={row.feature}
              className={cn(
                'grid grid-cols-3 text-sm',
                index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
              )}
            >
              <div className="px-6 py-4 font-medium text-navy-900">{row.feature}</div>
              <div className="px-6 py-4 flex justify-center">
                {row.us === true ? (
                  <CheckCircle className="w-5 h-5 text-industrial-green" />
                ) : (
                  <span className="text-slate-500">{row.us}</span>
                )}
              </div>
              <div className="px-6 py-4 flex justify-center">
                {row.them === true ? (
                  <CheckCircle className="w-5 h-5 text-slate-400" />
                ) : row.them === false ? (
                  <X className="w-5 h-5 text-red-400" />
                ) : (
                  <span className="text-slate-500">{row.them}</span>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// Testimonials
function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const testimonials = [
    {
      role: 'Operations Manager',
      company: 'Manufacturing Plant, Ota',
      quote:
        'Industrial Nexus eliminated the blind spots in our consumables supply chain. We now know exactly where every shipment is and when it will arrive.',
    },
    {
      role: 'Procurement Lead',
      company: 'Industrial Supplier, Ikeja',
      quote:
        'The Weight Watch engine has dramatically reduced cargo damage and vehicle mismatches. Our delivery disputes have dropped to nearly zero.',
    },
    {
      role: 'Warehouse Supervisor',
      company: 'Distribution Center, Agbara',
      quote:
        'Finally, a logistics platform that understands industrial operations. The SOP enforcement and digital POD have transformed our dispatch process.',
    },
    {
      role: 'Factory Executive',
      company: 'Steel Fabrication, Sagamu',
      quote:
        'We have cut lead times and improved production planning because we can trust the delivery windows we see in the Control Tower.',
    },
  ];

  return (
    <Section className="bg-slate-50">
      <div className="container-wide">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-950 mb-4">Trusted by Industrial Operators</h2>
          <p className="text-lg text-slate-600">
            Early feedback from manufacturers and logistics teams across the corridor.
          </p>
        </div>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.role}
              variants={fadeInUp}
              className="p-6 bg-white rounded-2xl border border-slate-200"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">"{t.quote}"</p>
              <div>
                <div className="font-semibold text-navy-950">{t.role}</div>
                <div className="text-sm text-slate-500">{t.company}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// Security
function SecuritySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const items = [
    { icon: Shield, title: 'AES-256 Encryption', desc: 'Data in transit and at rest is protected with industry-standard encryption.' },
    { icon: Users, title: 'Role-Based Access', desc: 'Granular permissions for Super Admin, Operations, Client, and Driver roles.' },
    { icon: FileText, title: 'Audit Logs', desc: 'Complete traceability of every action across the platform.' },
    { icon: Compass, title: 'Secure Authentication', desc: 'JWT-based auth with refresh tokens and password hashing.' },
    { icon: CheckCircle, title: 'Data Integrity', desc: 'Validations and constraints ensure accurate operational records.' },
    { icon: Globe, title: 'Enterprise Compliance', desc: 'Built with enterprise-grade reliability and security practices.' },
  ];

  return (
    <Section id="security">
      <div className="container-wide">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-950 mb-4">Enterprise Security</h2>
          <p className="text-lg text-slate-600">
            Security and compliance built into every layer of the platform.
          </p>
        </div>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {items.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeInUp}
              className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-200"
            >
              <div className="w-12 h-12 rounded-xl bg-navy-900/10 flex items-center justify-center shrink-0 text-navy-900">
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-navy-950 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// Final CTA
function FinalCta() {
  return (
    <Section id="demo" className="bg-navy-950 text-white">
      <div className="container-wide">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Modernize Your Industrial Logistics Operations?
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Join manufacturers and suppliers across the Lagos–Ogun corridor that are replacing
            fragmented logistics with operational intelligence.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-navy-950 bg-white rounded-xl hover:bg-slate-100 transition-colors"
            >
              Schedule a Demo
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white border border-white/30 rounded-xl hover:bg-white/10 transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}

// Footer
function Footer() {
  const links = {
    Company: ['About', 'Careers', 'News', 'Partners'],
    Solutions: ['Control Tower', 'Driver PWA', 'Client Portal', 'Analytics'],
    Industries: ['Manufacturing', 'Warehousing', 'Distribution', 'Industrial Suppliers'],
    Resources: ['Documentation', 'API Reference', 'Case Studies', 'Support'],
  };

  return (
    <footer className="bg-navy-950 text-slate-400 section-padding py-16 border-t border-white/10">
      <div className="container-wide">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2 font-bold text-xl text-white mb-4">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <Truck className="w-5 h-5 text-navy-900" />
              </div>
              Industrial Nexus
            </a>
            <p className="text-sm leading-relaxed max-w-sm mb-6">
              Operational infrastructure for industrial logistics across the Lagos–Ogun corridor.
              Keeping industry moving with precision, visibility, and control.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href="mailto:hello@industrialnexus.ng" className="hover:text-white transition-colors" aria-label="Email">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
          </div>
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-white font-semibold mb-4">{category}</h4>
              <ul className="space-y-2 text-sm">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <div>© {new Date().getFullYear()} Industrial Nexus. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main page
export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ShowcaseSection />
      <KpiSection />
      <CorridorSection />
      <WhyUsSection />
      <TestimonialsSection />
      <SecuritySection />
      <FinalCta />
      <Footer />
    </main>
  );
}
