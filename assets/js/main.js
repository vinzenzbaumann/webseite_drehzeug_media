const sections = Array.from(document.querySelectorAll(".reel"));
let currentSection = 0;
let isNavigatingSection = false;
let navigationTimeout;
let sectionScrollFrame;
let previousScrollBehavior;
let previousScrollSnapType;

function finishSectionNavigation() {
  if (!isNavigatingSection || sectionScrollFrame !== undefined) {
    return;
  }

  isNavigatingSection = false;
  window.clearTimeout(navigationTimeout);
}

window.addEventListener("scroll", () => {
  if (!isNavigatingSection || sectionScrollFrame !== undefined) {
    return;
  }

  window.clearTimeout(navigationTimeout);
  navigationTimeout = window.setTimeout(finishSectionNavigation, 150);
}, { passive: true });

window.addEventListener("scrollend", finishSectionNavigation);

function updateActiveSection() {
  sections.forEach((section, index) => {
    section.classList.toggle("active", index === currentSection);
  });

  const contactButton = document.querySelector(".contact-button");
  if (contactButton) {
    const isLastSection = currentSection === sections.length - 1;
    contactButton.style.opacity = isLastSection ? "0" : "1";
    contactButton.style.pointerEvents = isLastSection ? "none" : "auto";
  }

  const homeButton = document.querySelector(".home-button");
  if (homeButton) {
    const isHomeSection = sections[currentSection]?.id === "startseite";
    homeButton.style.opacity = isHomeSection ? "0" : "1";
    homeButton.style.pointerEvents = isHomeSection ? "none" : "auto";
  }
}

const sectionAnimations = new WeakMap();

function clearSectionAnimations(section) {
  sectionAnimations.get(section)?.forEach(({ animation, clone, original, visibility }) => {
    animation.cancel();
    clone.remove();
    original.style.visibility = visibility;
  });
  sectionAnimations.delete(section);
}

function animateSectionHeadings(section, startX, endX, entering = false, duration = 700) {
  clearSectionAnimations(section);
  const sectionTop = section.getBoundingClientRect().top;
  const animations = Array.from(section.querySelectorAll("h1, h2, h3, .line"), (original) => {
    const computed = window.getComputedStyle(original);
    const rect = original.getBoundingClientRect();
    const isLine = original.matches(".line");
    const isVerticallyCenteredHeading = original.matches("h1, h2");
    const top = isLine
      ? window.innerHeight * 0.44
      : entering
        ? isVerticallyCenteredHeading
          ? original.offsetTop - original.offsetHeight / 2
          : rect.top - sectionTop
        : rect.top;
    const clone = original.cloneNode(true);
    clone.removeAttribute("id");
    clone.classList.add("heading-transition-clone");
    clone.setAttribute("aria-hidden", "true");
    clone.style.position = "fixed";
    clone.style.left = isLine ? `${window.innerWidth * 0.01}px` : `${rect.left}px`;
    clone.style.top = `${top}px`;
    clone.style.bottom = "auto";
    clone.style.width = isLine ? "98vw" : `${original.offsetWidth}px`;
    clone.style.height = isLine ? "0" : `${original.offsetHeight}px`;
    clone.style.margin = "0";
    clone.style.zIndex = computed.zIndex;
    clone.style.font = computed.font;
    clone.style.letterSpacing = computed.letterSpacing;
    clone.style.lineHeight = computed.lineHeight;
    clone.style.color = computed.color;
    clone.style.webkitTextStroke = computed.webkitTextStroke;
    clone.style.textShadow = computed.textShadow;
    clone.style.textAlign = computed.textAlign;
    clone.style.opacity = entering ? "1" : computed.opacity;
    if (isLine) {
      clone.style.borderTop = computed.borderTop;
      clone.style.borderRadius = computed.borderRadius;
      clone.style.transform = "none";
    } else {
      clone.style.transform = "none";
    }

    document.body.append(clone);
    const visibility = original.style.visibility;
    original.style.visibility = "hidden";

    const animation = clone.animate(
      [{ translate: `${startX}vw 0` }, { translate: `${endX}vw 0` }],
      { duration, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "both" }
    );
    const record = { animation, clone, original, visibility };
    animation.onfinish = () => {
      clone.remove();
      original.style.visibility = visibility;
      const activeAnimations = sectionAnimations.get(section);
      if (activeAnimations) {
        const remaining = activeAnimations.filter((item) => item !== record);
        if (remaining.length) {
          sectionAnimations.set(section, remaining);
        } else {
          sectionAnimations.delete(section);
        }
      }
    };
    return record;
  });
  sectionAnimations.set(section, animations);
}

function setActiveSection(index, direction = Math.sign(index - currentSection), duration = 700) {
  if (index < 0 || index >= sections.length || index === currentSection) {
    return;
  }

  const previousSection = sections[currentSection];
  const nextSection = sections[index];

  animateSectionHeadings(previousSection, 0, direction > 0 ? -100 : 100, false, duration);
  currentSection = index;
  updateActiveSection();
  animateSectionHeadings(nextSection, direction > 0 ? 100 : -100, 0, true, duration);
}

const sectionObserver = new IntersectionObserver((entries) => {
  const mostVisibleSection = entries
    .filter((entry) => entry.isIntersecting)
    .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

  if (!mostVisibleSection) {
    return;
  }
  const sectionIndex = sections.indexOf(mostVisibleSection.target);
  if (!isNavigatingSection && sectionIndex !== -1) {
    setActiveSection(sectionIndex);
  }
}, { threshold: [0.6] });

sections.forEach((section) => sectionObserver.observe(section));

function goToSection(index) {
  if (document.body.classList.contains("is-loading") ||
      index < 0 || index >= sections.length || index === currentSection) {
    return;
  }

  const isInterruptingNavigation = sectionScrollFrame !== undefined;
  window.cancelAnimationFrame(sectionScrollFrame);
  const start = window.scrollY;
  const destination = sections[index].offsetTop;
  const distance = Math.abs(index - currentSection);
  const duration = Math.max(700, distance * 240);
  const startedAt = performance.now();
  const scrollBehavior = isInterruptingNavigation
    ? previousScrollBehavior
    : document.documentElement.style.scrollBehavior;
  const scrollSnapType = isInterruptingNavigation
    ? previousScrollSnapType
    : document.documentElement.style.scrollSnapType;
  previousScrollBehavior = scrollBehavior;
  previousScrollSnapType = scrollSnapType;
  document.documentElement.style.scrollBehavior = "auto";
  document.documentElement.style.scrollSnapType = "none";

  setActiveSection(index, Math.sign(index - currentSection), duration);
  isNavigatingSection = true;
  window.clearTimeout(navigationTimeout);
  navigationTimeout = window.setTimeout(finishSectionNavigation, duration + 150);

  function animateScroll(time) {
    const progress = Math.min((time - startedAt) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    window.scrollTo(0, start + (destination - start) * easedProgress);

    if (progress < 1) {
      sectionScrollFrame = window.requestAnimationFrame(animateScroll);
      return;
    }

    window.scrollTo(0, destination);
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    document.documentElement.style.scrollSnapType = previousScrollSnapType;
    previousScrollBehavior = undefined;
    previousScrollSnapType = undefined;
    sectionScrollFrame = undefined;
  }

  sectionScrollFrame = window.requestAnimationFrame(animateScroll);
}

function setFavicon() {
  const favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.type = "image/png";
  favicon.href = "assets/ressource/kringel.png";
  document.head.appendChild(favicon);
}

setFavicon();
updateActiveSection();

const pageLoader = document.querySelector(".page-loader");
if (pageLoader) {
  const loaderStartedAt = performance.now();
  let dismissalScheduled = false;

  function dismissPageLoader() {
    if (dismissalScheduled) {
      return;
    }

    dismissalScheduled = true;
    const minimumDisplayTime = 700;
    const remainingDisplayTime = Math.max(0, minimumDisplayTime - (performance.now() - loaderStartedAt));

    window.setTimeout(() => {
      pageLoader.classList.add("is-flashing");
      window.setTimeout(() => {
        pageLoader.classList.add("is-hidden");
        document.body.classList.remove("is-loading");
        document.documentElement.classList.remove("is-loading");
        document.body.classList.add("logo-revealed");
        window.setTimeout(() => pageLoader.remove(), 500);
      }, 120);
    }, remainingDisplayTime);
  }
  window.addEventListener("load", dismissPageLoader, { once: true });
  window.addEventListener("load", dismissPageLoader, { once: true });
}

const sparkCanvas = document.querySelector(".spark-canvas");
const sparkContext = sparkCanvas?.getContext("2d");
const sparks = [];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lastFrameTime = 0;

function resizeSparkCanvas() {
  if (!sparkCanvas || !sparkContext) {
    return;
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  sparkCanvas.width = Math.round(window.innerWidth * pixelRatio);
  sparkCanvas.height = Math.round(window.innerHeight * pixelRatio);
  sparkContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function addSparkBurst(x, y, amount, radius = amount > 20 ? 46 : 24) {
  for (let index = 0; index < amount && sparks.length < 180; index += 1) {
    const angle = amount > 20
      ? (index / amount) * Math.PI * 2 + (Math.random() - 0.5) * 0.12
      : Math.random() * Math.PI * 2;
    const spread = amount > 20 ? 42 : 22;
    const originAngle = Math.random() * Math.PI * 2;
    const originRadius = Math.sqrt(Math.random()) * spread;
    const life = 150 + Math.random() * 90;
    sparks.push({
      originX: x + Math.cos(originAngle) * originRadius,
      originY: y + Math.sin(originAngle) * originRadius,
      angle,
      angularSpeed: (0.008 + Math.random() * 0.008) * (Math.random() < 0.5 ? -1 : 1),
      radius: Math.random() * 5,
      radiusLimit: radius * (0.8 + Math.random() * 0.4),
      radialSpeed: 0.1 + Math.random() * 0.12,
      riseSpeed: amount === 1 ? 0.07 : 0.015,
      life,
      maxLife: life,
      size: 1.4 + Math.random() * (amount > 20 ? 2.2 : 1.8),
      hue: 20 + Math.random() * 30
    });
  }
}

function animateSparks(time) {
  if (!sparkContext || !sparkCanvas || reducedMotion) {
    return;
  }

  const frameScale = lastFrameTime ? Math.min((time - lastFrameTime) / 16.67, 2) : 1;
  lastFrameTime = time;
  sparkContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

  if (sparks.length < 48 && Math.random() < 0.035) {
    addSparkBurst(Math.random() * window.innerWidth, window.innerHeight + 4, 1);
  }

  for (let index = sparks.length - 1; index >= 0; index -= 1) {
    const spark = sparks[index];
    spark.angle += spark.angularSpeed * frameScale;
    spark.radius = Math.min(spark.radius + spark.radialSpeed * frameScale, spark.radiusLimit);
    spark.life -= frameScale;

    if (spark.life <= 0) {
      sparks.splice(index, 1);
      continue;
    }

    const alpha = Math.pow(spark.life / spark.maxLife, 2.2) * 0.68;
    const x = spark.originX + Math.cos(spark.angle) * spark.radius;
    const y = spark.originY + Math.sin(spark.angle) * spark.radius - (spark.maxLife - spark.life) * spark.riseSpeed;
    sparkContext.beginPath();
    sparkContext.fillStyle = `hsla(${spark.hue}, 100%, 68%, ${alpha})`;
    sparkContext.shadowColor = `hsla(${spark.hue}, 100%, 60%, ${alpha})`;
    sparkContext.shadowBlur = spark.size * 3.5;
    sparkContext.arc(x, y, spark.size * alpha * 1.2, 0, Math.PI * 2);
    sparkContext.fill();
  }

  sparkContext.shadowBlur = 0;
  window.requestAnimationFrame(animateSparks);
}

if (sparkCanvas && sparkContext && !reducedMotion) {
  resizeSparkCanvas();
  window.addEventListener("resize", resizeSparkCanvas);
  addSparkBurst(window.innerWidth / 2, window.innerHeight * 0.58, 32);
  for (let index = 0; index < 24; index += 1) {
    addSparkBurst(Math.random() * window.innerWidth, Math.random() * window.innerHeight, 1);
  }
  window.requestAnimationFrame(animateSparks);

  let lastDragPosition;
  let lastDragSparkTime = 0;

  document.addEventListener("pointerdown", (event) => {
    if (event.button === 0) {
      lastDragPosition = { x: event.clientX, y: event.clientY };
    }
  }, { passive: true });

  document.addEventListener("pointermove", (event) => {
    if (!lastDragPosition || event.buttons === 0) {
      return;
    }

    const distance = Math.hypot(event.clientX - lastDragPosition.x, event.clientY - lastDragPosition.y);
    if (distance < 7 || performance.now() - lastDragSparkTime < 35) {
      return;
    }

    lastDragPosition = { x: event.clientX, y: event.clientY };
    lastDragSparkTime = performance.now();
    addSparkBurst(event.clientX, event.clientY, 2, 20);
  }, { passive: true });

  const stopDragSparks = () => {
    lastDragPosition = undefined;
  };
  document.addEventListener("pointerup", stopDragSparks, { passive: true });
  document.addEventListener("pointercancel", stopDragSparks, { passive: true });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const isHomeButton = target.closest(".home-button");
    const rect = isHomeButton?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : event.clientX;
    const y = rect ? rect.top + rect.height / 2 : event.clientY;
    addSparkBurst(x, y, isHomeButton ? 38 : 12, isHomeButton ? 58 : 26);
  });
}

window.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey ||
      event.target instanceof HTMLElement &&
      (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName))) {
    return;
  }

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if (!event.repeat) {
      goToSection(currentSection + (event.key === "ArrowDown" ? 1 : -1));
    }
  }
});

document.querySelector(".contact-button")?.addEventListener("click", (event) => {
  event.preventDefault();
  const contactIndex = sections.findIndex((section) => section.id === "kontakt");
  goToSection(contactIndex);
});

document.querySelector(".home-button")?.addEventListener("click", (event) => {
  event.preventDefault();
  goToSection(0);
});

let wheelHandled = false;
let wheelDirection = 0;
let wheelResetTimeout;

window.addEventListener("wheel", (event) => {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
    return;
  }

  event.preventDefault();
  const direction = Math.sign(event.deltaY);

  window.clearTimeout(wheelResetTimeout);
  wheelResetTimeout = window.setTimeout(() => {
    wheelHandled = false;
    wheelDirection = 0;
  }, 80);

  if (wheelHandled) {
    return;
  }

  wheelHandled = true;
  wheelDirection = direction;
  goToSection(currentSection + direction);
}, { passive: false });
