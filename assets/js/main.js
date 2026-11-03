const sections = Array.from(document.querySelectorAll(".reel"));
const animatedSections = sections.map((section) => ({
  section,
  elements: Array.from(section.querySelectorAll("h1, h2, h3, .line")),
  top: section.offsetTop,
  height: section.offsetHeight,
  lastProgress: undefined,
  lastViewportCenterOffset: undefined
}));
const mobileViewport = window.matchMedia("(max-width: 768px)");
let currentSection = 0;
let isNavigatingSection = false;
let homeButtonWasVisible = window.scrollY > 8;
let navigationTimeout;
let sectionScrollFrame;
let previousScrollBehavior;
let previousScrollSnapType;

function refreshSectionMeasurements() {
  animatedSections.forEach((entry) => {
    entry.top = entry.section.offsetTop;
    entry.height = entry.section.offsetHeight;
  });
}

function finishSectionNavigation() {
  if (!isNavigatingSection || sectionScrollFrame !== undefined) {
    return;
  }

  isNavigatingSection = false;
  window.clearTimeout(navigationTimeout);
}

function setHomeButtonVisibility(homeButton, shouldShow) {
  const shouldFlash = shouldShow && !homeButtonWasVisible;
  homeButtonWasVisible = shouldShow;
  homeButton.classList.toggle("is-visible", shouldShow);
  homeButton.style.pointerEvents = shouldShow ? "auto" : "none";

  if (!shouldFlash || reducedMotion) {
    return;
  }

  homeButton.classList.remove("is-flashing");
  void homeButton.offsetWidth;
  homeButton.classList.add("is-flashing");
  window.setTimeout(() => homeButton.classList.remove("is-flashing"), 650);
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
    setHomeButtonVisibility(homeButton, window.scrollY > 8);
  }
}

function syncHomeButtonVisibility() {
  const homeButton = document.querySelector(".home-button");
  if (!homeButton) {
    return;
  }

  setHomeButtonVisibility(homeButton, window.scrollY > 8);
}

function updateScrollLinkedAnimations() {
  const scrollPosition = window.scrollY;

  let closestSection = currentSection;
  let closestDistance = Number.POSITIVE_INFINITY;
  animatedSections.forEach((entry, index) => {
    const { section, elements, top, height } = entry;
    const distance = Math.abs(top - scrollPosition);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestSection = index;
    }

    const progress = Math.max(-1, Math.min(1, (scrollPosition - top) / height));
    if (progress !== entry.lastProgress) {
      const visibility = 1 - Math.abs(progress);
      section.style.setProperty("--reel-progress", String(progress));
      section.style.setProperty("--reel-visibility", String(visibility));
      const horizontalOffset = `${-progress * (mobileViewport.matches ? 50 : 100)}vw`;
      elements.forEach((element) => {
        element.style.translate = mobileViewport.matches
          ? horizontalOffset
          : `${horizontalOffset} ${scrollPosition - top}px`;
      });
      entry.lastProgress = progress;
    }
  });

  return closestSection;
}

function setActiveSection(index) {
  if (index < 0 || index >= sections.length || index === currentSection) {
    return;
  }

  currentSection = index;
  updateActiveSection();
}

let scrollUpdateFrame;
function scheduleScrollLinkedUpdate() {
  if (scrollUpdateFrame !== undefined) {
    return;
  }

  scrollUpdateFrame = window.requestAnimationFrame(() => {
    scrollUpdateFrame = undefined;
    syncHomeButtonVisibility();
    const closestSection = updateScrollLinkedAnimations();

    if (!isNavigatingSection && sections.length) {
      setActiveSection(closestSection);
    }
  });
}

window.addEventListener("scroll", scheduleScrollLinkedUpdate, { passive: true });
window.addEventListener("resize", () => {
  refreshSectionMeasurements();
  resizeSparkCanvas();
  if (!mobileViewport.matches) {
    scheduleSparkAnimation();
  }
  scheduleScrollLinkedUpdate();
}, { passive: true });

function goToSection(index) {
  if (document.body.classList.contains("is-loading") ||
      index < 0 || index >= sections.length) {
    return;
  }

  const destination = sections[index].getBoundingClientRect().top + window.scrollY;
  if (Math.abs(destination - window.scrollY) < 1) {
    return;
  }

  const isInterruptingNavigation = sectionScrollFrame !== undefined;
  window.cancelAnimationFrame(sectionScrollFrame);
  const start = window.scrollY;
  const distance = Math.abs(index - currentSection);
  const duration = Math.max(800, distance * 240);
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

  setActiveSection(index);
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
updateScrollLinkedAnimations();

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
let sparkAnimationFrame;
let activeFlame;
const rapidClicks = [];

function scheduleSparkAnimation() {
  if (sparkAnimationFrame === undefined && !reducedMotion) {
    sparkAnimationFrame = window.requestAnimationFrame(animateSparks);
  }
}

function resizeSparkCanvas() {
  if (!sparkCanvas || !sparkContext) {
    return;
  }

  const pixelRatio = mobileViewport.matches
    ? 1
    : Math.min(window.devicePixelRatio || 1, 2);
  sparkCanvas.width = Math.round(window.innerWidth * pixelRatio);
  sparkCanvas.height = Math.round(window.innerHeight * pixelRatio);
  sparkContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function addSparkBurst(x, y, amount, radius = amount > 20 ? 46 : 24) {
  const particleCount = mobileViewport.matches ? Math.max(1, Math.ceil(amount * 0.35)) : amount;
  const maxSparks = mobileViewport.matches ? 32 : 72;
  for (let index = 0; index < particleCount && sparks.length < maxSparks; index += 1) {
    const angle = amount > 20
      ? (index / amount) * Math.PI * 2 + (Math.random() - 0.5) * 0.12
      : Math.random() * Math.PI * 2;
    const spread = amount > 20 ? 42 : 22;
    const originAngle = Math.random() * Math.PI * 2;
    const originRadius = Math.sqrt(Math.random()) * spread;
    const speed = amount > 20 ? 0.9 + Math.random() * 2.3 : 0.5 + Math.random() * 1.5;
    const life = 38 + Math.random() * 35;
    const originX = x + Math.cos(originAngle) * originRadius;
    const originY = y + Math.sin(originAngle) * originRadius;
    sparks.push({
      x: originX,
      y: originY,
      previousX: originX,
      previousY: originY,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed - (amount > 20 ? 0.45 : 0.18),
      gravity: 0.022 + Math.random() * 0.022,
      drag: 0.982 + Math.random() * 0.012,
      life,
      maxLife: life,
      size: 0.7 + Math.random() * (amount > 20 ? 1.5 : 1.2),
      hue: 24 + Math.random() * 22
    });
  }
  scheduleSparkAnimation();
}

function drawFlame(time) {
  if (!activeFlame) {
    return;
  }

  const remaining = activeFlame.expiresAt - time;
  if (remaining <= 0) {
    activeFlame = undefined;
    return;
  }

  const age = 1 - remaining / 2000;
  const flicker = Math.sin(time * 0.025) * 3.5 + Math.sin(time * 0.047) * 2;
  const heightFlicker = Math.sin(time * 0.031) * 5 + Math.sin(time * 0.013) * 3;
  activeFlame.x += (activeFlame.targetX - activeFlame.x) * 0.24;
  activeFlame.y += (activeFlame.targetY - activeFlame.y) * 0.24;
  activeFlame.tilt += (activeFlame.targetTilt - activeFlame.tilt) * 0.14;
  activeFlame.targetTilt *= 0.9;

  if (!sparkContext) {
    return;
  }

  sparkContext.save();
  sparkContext.globalAlpha = Math.min(1, remaining / 180) * (0.9 + Math.sin(time * 0.018) * 0.08);
  sparkContext.translate(activeFlame.x, activeFlame.y);
  sparkContext.rotate(activeFlame.tilt);
  sparkContext.scale(1.05 + age * 0.12, 0.96 + Math.sin(time * 0.019) * 0.1);

  sparkContext.shadowColor = "rgba(255, 104, 18, 0.9)";
  sparkContext.shadowBlur = 30;
  sparkContext.beginPath();
  sparkContext.moveTo(-8, 0);
  sparkContext.bezierCurveTo(-19, -12, -12, -27, -7, -40);
  sparkContext.bezierCurveTo(-2, -33, 3, -45, 1, -56);
  sparkContext.bezierCurveTo(2, -66, 8, -72, 7 + flicker, -82 - heightFlicker);
  sparkContext.bezierCurveTo(22 + flicker, -62, 24, -45, 16, -31);
  sparkContext.bezierCurveTo(21, -17, 15, -6, 8, 0);
  sparkContext.closePath();
  const outerGradient = sparkContext.createLinearGradient(0, -88, 0, 0);
  outerGradient.addColorStop(0, "rgba(255, 76, 8, 0.12)");
  outerGradient.addColorStop(0.24, "rgba(255, 74, 5, 0.94)");
  outerGradient.addColorStop(0.68, "rgba(255, 137, 13, 0.98)");
  outerGradient.addColorStop(1, "rgba(255, 207, 72, 0.9)");
  sparkContext.fillStyle = outerGradient;
  sparkContext.fill();

  sparkContext.beginPath();
  sparkContext.moveTo(-4, 0);
  sparkContext.bezierCurveTo(-11, -12, -5, -23, -4, -33);
  sparkContext.bezierCurveTo(-2, -43, 3, -50, 5 + flicker * 0.55, -62 - heightFlicker * 0.6);
  sparkContext.bezierCurveTo(15, -44, 13, -29, 8, -17);
  sparkContext.bezierCurveTo(10, -9, 7, -3, 4, 0);
  sparkContext.closePath();
  sparkContext.shadowBlur = 10;
  const innerGradient = sparkContext.createLinearGradient(0, -67, 0, 0);
  innerGradient.addColorStop(0, "rgba(255, 172, 28, 0.08)");
  innerGradient.addColorStop(0.38, "rgba(255, 204, 48, 0.94)");
  innerGradient.addColorStop(1, "rgba(255, 250, 207, 0.98)");
  sparkContext.fillStyle = innerGradient;
  sparkContext.fill();

  sparkContext.shadowBlur = 0;
  sparkContext.beginPath();
  sparkContext.moveTo(-4, 0);
  sparkContext.bezierCurveTo(-8, -5, -5, -11, 0, -16);
  sparkContext.bezierCurveTo(6, -10, 7, -4, 4, 0);
  sparkContext.closePath();
  sparkContext.fillStyle = "rgba(255, 249, 218, 0.94)";
  sparkContext.fill();

  sparkContext.beginPath();
  sparkContext.ellipse(0, -1, 7, 3, 0, 0, Math.PI * 2);
  const baseGlow = sparkContext.createRadialGradient(0, -1, 0, 0, -1, 10);
  baseGlow.addColorStop(0, "rgba(181, 224, 255, 0.75)");
  baseGlow.addColorStop(1, "rgba(63, 130, 255, 0)");
  sparkContext.fillStyle = baseGlow;
  sparkContext.fill();
  sparkContext.restore();
}

function animateSparks(time) {
  sparkAnimationFrame = undefined;
  if (!sparkContext || !sparkCanvas || reducedMotion) {
    return;
  }

  const frameScale = lastFrameTime ? Math.min((time - lastFrameTime) / 16.67, 2) : 1;
  lastFrameTime = time;
  sparkContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

  if (!mobileViewport.matches && sparks.length < 48 && Math.random() < 0.035) {
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

    const lifeRatio = spark.life / spark.maxLife;
    const alpha = Math.pow(lifeRatio, 1.8) * 0.9;
    spark.previousX = spark.x;
    spark.previousY = spark.y;
    spark.velocityX *= Math.pow(spark.drag, frameScale);
    spark.velocityY = spark.velocityY * Math.pow(spark.drag, frameScale) + spark.gravity * frameScale;
    spark.x += spark.velocityX * frameScale;
    spark.y += spark.velocityY * frameScale;

    sparkContext.beginPath();
    sparkContext.moveTo(spark.previousX, spark.previousY);
    sparkContext.lineTo(spark.x, spark.y);
    sparkContext.lineCap = "round";
    sparkContext.strokeStyle = `hsla(${spark.hue}, 100%, 62%, ${alpha * 0.7})`;
    sparkContext.lineWidth = Math.max(0.35, spark.size * alpha);
    sparkContext.shadowColor = `hsla(${spark.hue}, 100%, 58%, ${alpha})`;
    sparkContext.shadowBlur = mobileViewport.matches ? 0 : spark.size * 2.5;
    sparkContext.stroke();

    const coreRadius = Math.max(0.25, spark.size * lifeRatio);
    sparkContext.beginPath();
    if (mobileViewport.matches) {
      sparkContext.fillStyle = `hsla(${spark.hue}, 100%, 76%, ${alpha})`;
      sparkContext.arc(spark.x, spark.y, coreRadius, 0, Math.PI * 2);
    } else {
      const core = sparkContext.createRadialGradient(
        spark.x, spark.y, 0, spark.x, spark.y, coreRadius * 2.2
      );
      core.addColorStop(0, `rgba(255, 255, 225, ${alpha})`);
      core.addColorStop(0.28, `hsla(${spark.hue}, 100%, 76%, ${alpha})`);
      core.addColorStop(1, `hsla(${spark.hue}, 100%, 55%, 0)`);
      sparkContext.fillStyle = core;
      sparkContext.arc(spark.x, spark.y, coreRadius * 2.2, 0, Math.PI * 2);
    }
    sparkContext.fill();
  }

  drawFlame(time);
  sparkContext.shadowBlur = 0;
  if (sparks.length || activeFlame) {
    scheduleSparkAnimation();
  }
}

if (sparkCanvas && sparkContext && !reducedMotion) {
  resizeSparkCanvas();

  let lastDragPosition;
  let lastDragSparkTime = 0;

  document.addEventListener("pointerdown", (event) => {
    if (event.button === 0) {
      lastDragPosition = { x: event.clientX, y: event.clientY };
    }
  }, { passive: true });

  document.addEventListener("pointermove", (event) => {
    if (activeFlame) {
      const elapsed = Math.max(1, performance.now() - activeFlame.lastMoveTime);
      const velocityX = (event.clientX - activeFlame.lastPointerX) / elapsed;
      activeFlame.targetX = event.clientX;
      activeFlame.targetY = event.clientY;
      activeFlame.targetTilt = Math.max(-0.65, Math.min(0.65, -velocityX * 0.65));
      activeFlame.lastPointerX = event.clientX;
      activeFlame.lastPointerY = event.clientY;
      activeFlame.lastMoveTime = performance.now();
    }

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

    const now = performance.now();
    rapidClicks.push({ time: now, x: event.clientX, y: event.clientY });
    while (rapidClicks.length && now - rapidClicks[0].time > 2000) {
      rapidClicks.shift();
    }

    if (rapidClicks.length >= 15 && !reducedMotion) {
      activeFlame = {
        x: event.clientX,
        y: event.clientY,
        targetX: event.clientX,
        targetY: event.clientY,
        lastPointerX: event.clientX,
        lastPointerY: event.clientY,
        lastMoveTime: now,
        tilt: 0,
        targetTilt: 0,
        expiresAt: now + 2000
      };
      addSparkBurst(event.clientX, event.clientY, 20, 32);
      rapidClicks.length = 0;
    }

    const isHomeButton = target.closest(".home-button");
    const rect = isHomeButton?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : event.clientX;
    const y = rect ? rect.top + rect.height / 2 : event.clientY;
    addSparkBurst(x, y, isHomeButton ? 38 : 12, isHomeButton ? 58 : 26);
  });
}

if ("IntersectionObserver" in window) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      const video = target;
      if (isIntersecting) {
        const source = video.querySelector("source[data-src]");
        if (source) {
          source.src = source.dataset.src;
          source.removeAttribute("data-src");
          video.load();
        }
        video.play().catch((error) => {
          if (error.name !== "AbortError") {
            console.warn("Could not resume an in-view background video.", error);
          }
        });
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.01 });

  document.querySelectorAll(".bg-video, .bg-video_1").forEach((video) => {
    videoObserver.observe(video);
  });
} else {
  document.querySelectorAll(".bg-video, .bg-video_1").forEach((video) => {
    const source = video.querySelector("source[data-src]");
    if (source) {
      source.src = source.dataset.src;
      source.removeAttribute("data-src");
      video.load();
    }
  });
}

syncHomeButtonVisibility();

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
let wheelResetTimeout;

function scheduleWheelReset() {
  window.clearTimeout(wheelResetTimeout);
  wheelResetTimeout = window.setTimeout(() => {
    if (isNavigatingSection) {
      scheduleWheelReset();
      return;
    }

    wheelHandled = false;
  }, 120);
}

window.addEventListener("wheel", (event) => {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
    return;
  }

  event.preventDefault();
  const direction = Math.sign(event.deltaY);
  scheduleWheelReset();

  if (wheelHandled) {
    return;
  }

  wheelHandled = true;
  goToSection(currentSection + direction);
}, { passive: false });
