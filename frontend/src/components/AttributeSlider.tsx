interface AttributeSliderProps {
  label: string;
  attrKey: string;
  value: number;
  onChange: (val: number) => void;
  color: string;
  icon: string;
}

export default function AttributeSlider({
  label,
  attrKey,
  value,
  onChange,
  color,
  icon,
}: AttributeSliderProps) {
  const pct = (value / 21) * 100;

  return (
    <div className={`attr-slider attr-${attrKey}`} style={{ '--attr-color': color } as React.CSSProperties}>
      <div className="attr-slider-header">
        <span className="attr-icon">{icon}</span>
        <span className="attr-label">{label}</span>
        <span className="attr-value" style={{ color }}>{value}</span>
      </div>
      <div className="attr-track-container">
        <div className="attr-track">
          <div className="attr-track-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
        <input
          type="range"
          min={0}
          max={21}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="attr-range"
        />
      </div>
    </div>
  );
}

export function AttributeBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = (value / 21) * 100;

  return (
    <div className="attr-bar">
      <div className="attr-bar-label">
        <span>{label}</span>
        <span className="attr-bar-value" style={{ color }}>{value.toFixed(1)}</span>
      </div>
      <div className="attr-bar-track">
        <div className="attr-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}