// UI-specific helper utilities for battle screens
// Status icon mappings and battle UI helpers

// Status icon configuration lookup table
export const STATUS_ICON_CONFIG = {
  assist: {
    emoji: '🎯',
    getTitle: (ic) => `Assist — +${Math.round((ic?.amount || 0.2) * 100)}% hit`
  },
  defend: {
    emoji: '💨',
    getTitle: () => 'Dodge - 50% evade chance, half damage from AoE'
  },
  help: {
    emoji: '🕷️',
    getTitle: () => 'Help — Preferred target (enemy more likely to attack)'
  },
  protected: {
    emoji: '🌪',
    getTitle: (ic) => {
      const turns = ic?.turns ? ` (${ic.turns} turn${ic.turns > 1 ? 's' : ''})` : '';
      return `Gaseous Form — Invulnerable${turns}`;
    }
  },
  stunned: {
    emoji: '💫',
    getTitle: (ic) => {
      const turns = ic?.turns ? ` for ${ic.turns} turn${ic.turns > 1 ? 's' : ''}` : '';
      return `Stunned — cannot act${turns}`;
    }
  },
  enfeebled: {
    emoji: '⬇️',
    getTitle: (ic) => {
      const turns = ic?.turns ? ` for ${ic.turns} turn${ic.turns > 1 ? 's' : ''}` : '';
      return `Enfeebled — physical attacks deal half damage${turns}`;
    }
  },
  lumalia: {
    emoji: '🕓',
    getTitle: (ic) => `Lumalia — Pending ${ic?.dmg || ''} damage`
  },
  blind: {
    emoji: '😵',
    getTitle: (ic) => {
      const turns = ic?.turns ? ` for ${ic.turns} turn${ic.turns > 1 ? 's' : ''}` : '';
      return `Blinded — 50% miss chance${turns}`;
    }
  },
  blinded: {
    emoji: '😵',
    getTitle: (ic) => {
      const turns = ic?.turns ? ` for ${ic.turns} turn${ic.turns > 1 ? 's' : ''}` : '';
      return `Blinded — 50% miss chance${turns}`;
    }
  }
};

export function getStatusIconData(statusId, iconData = null) {
  // Support being called with either a string id or an icon object ({ id, ... })
  let id = statusId;
  if (statusId && typeof statusId === 'object') {
    iconData = statusId;
    id = statusId.id;
  }

  const config = STATUS_ICON_CONFIG[id];
  if (!config) {
    // Fallback for unknown status
    const emoji = (id && typeof id === 'string' && id.length>0) ? id[0] : '?';
    const title = (id && typeof id === 'string') ? (id.charAt(0).toUpperCase() + id.slice(1)) : 'Unknown';
    const source = iconData?.source ? ` (${iconData.source})` : '';
    return { emoji, title: title + source };
  }

  return {
    emoji: config.emoji,
    title: config.getTitle(iconData)
  };
}

// Griff variant selection helper
export function getGriffVariant(ctx, slotObj) {
  let v = null;
  
  // Prefer encounter-level variant
  if (ctx?.encounter?._griffVariant) {
    v = ctx.encounter._griffVariant;
  }
  // Fall back to meta
  else if (ctx?.meta?.griffVariant) {
    v = ctx.meta.griffVariant;
  }
  // Fall back to localStorage
  else if (typeof localStorage !== 'undefined') {
    const ls = localStorage.getItem('griffVariant');
    if (ls) v = Number(ls);
  }
  // Parse from encounter image if present
  else if (ctx?.encounter?._griffImage) {
    const m = String(ctx.encounter._griffImage).match(/griff(\d+)\.png/i);
    if (m?.[1]) v = Number(m[1]);
  }
  
  // Last resort: pick one and persist
  if (!v) {
    v = Math.floor(Math.random() * 7) + 1;
    if (ctx?.encounter) {
      ctx.encounter._griffVariant = v;
    }
  }
  
  return `./assets/griff${v}.png`;
}

// Build ability button configuration
export function getAbilityButtonConfig(ability, abilityIndex, slotObj, idx, currentAp, ctx) {
  const label = ability?.name || ability?.ability || `Ability ${abilityIndex + 1}`;

  // Check AP requirement (default 1)
  const reqAp = (ability && (typeof ability.ap_cost === 'number' ? ability.ap_cost : (typeof ability.apCost === 'number' ? ability.apCost : 1))) || 1;
  const hasEnoughAp = (typeof currentAp === 'number') ? (currentAp >= reqAp) : (ctx?.encounter?.ap >= reqAp);

  // Check cooldown (per-instance key)
  const inst = slotObj?.cardId || String(idx);
  const key = `${inst}:ability${abilityIndex}`;
  const cd = ctx?.encounter?.abilityCooldowns?.[key] || 0;

  const attrs = { class: 'btn slot-action ability-btn', 'data-ability-index': String(abilityIndex) };

  return {
    label,
    attrs,
    disabled: !hasEnoughAp || cd > 0,
    cooldownBadge: cd > 0 ? String(cd) : null,
    title: cd > 0 ? `Cooldown: ${cd} turns` : undefined
  };
}
