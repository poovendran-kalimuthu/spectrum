import React, { useState, useEffect } from 'react';

const EventCountdown = ({ title, date }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    if (!date) return;
    const targetDate = new Date(date).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [date]);

  const pad = (num) => String(num).padStart(2, '0');

  // To match the 3 segments from the image, we can show DD:HH:MM if days > 0, or HH:MM:SS if days == 0.
  // Actually, standard is usually DD:HH:MM or HH:MM:SS. Let's show 4 segments if days > 0, otherwise 3.
  // Wait, let's just show Days, Hours, Minutes, Seconds separated by colons.
  // The image has 3 segments: 02 : 48 : 18. Let's assume it's Hours:Minutes:Seconds for the screenshot, 
  // but if there are days, we might want to include them. Let's just render HH:MM:SS if days is 0. 
  // Or render DD:HH:MM if days > 0.
  // Let's render DD : HH : MM if days > 0, else HH : MM : SS.
  // Actually, why not render all 4 if days > 0? Let's render an array of segments.
  const segments = [];
  if (timeLeft.days > 0) segments.push(pad(timeLeft.days));
  segments.push(pad(timeLeft.hours));
  segments.push(pad(timeLeft.minutes));
  segments.push(pad(timeLeft.seconds));
  
  // Wait, if we want exactly the look from the image, we can just use the mapped segments.

  return (
    <div className="adb-countdown-container">
      <div className="adb-countdown-header">
        <h2 className="adb-countdown-title">{title || 'Event Title'}</h2>
        <p className="adb-countdown-subtitle">Starts in</p>
      </div>
      <div className="adb-countdown-timer">
        {segments.map((segment, index) => (
          <React.Fragment key={index}>
            <div className="adb-countdown-segment">{segment}</div>
            {index < segments.length - 1 && (
              <div className="adb-countdown-colon">:</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default EventCountdown;
