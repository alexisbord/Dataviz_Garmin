import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Home, HeartPulse, BedDouble, Footprints } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function CumulativeDistance() {
  const [distances, setDistances] = useState([]);
  const svgRef = useRef();

  useEffect(() => {
    fetch('http://localhost:5000/api/running-data')
      .then(res => res.json())
      .then(data => setDistances(data));
  }, []);

  useEffect(() => {
    if (distances.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const data = distances.map(d => ({
      date: new Date(d.start_time),
      cumulativeDistance: d3.sum(distances.filter(x => new Date(x.start_time) <= new Date(d.start_time)), x => x.distance)
    }));

    
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([margin.left, width - margin.right]);

    // Use fixed start date: 18 July 2023
    const startDate = new Date(2023, 6, 18); // Month is 0-based: 6 = July
    const endDate = new Date(d3.max(data, d => d.date));
    endDate.setDate(endDate.getDate() + 1);  // pad endDate to capture final tick

    const tickValues = [];
    let tick = new Date(startDate);

    while (tick <= endDate) {
      tickValues.push(new Date(tick));
      tick.setMonth(tick.getMonth() + 3);
    }

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x)
        .tickValues(tickValues)
        .tickFormat(d3.timeFormat("%b %Y"))
      );
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.cumulativeDistance)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const maxDistance = d3.max(data, d => d.cumulativeDistance);
    const yTicks = d3.range(0, maxDistance, 400);

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickValues(yTicks).tickFormat(d => `${d} km`));

    svg.append("g")
      .attr("class", "grid-lines")
      .selectAll("line")
      .data(yTicks.filter(d => d !== 0)) 
      .join("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "2,2");
  

    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.cumulativeDistance));
    svg.attr("viewBox", [0, 0, width, height]);

    // Transparent wide path for hover detection (place FIRST)
    const hoverPath = svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "transparent")
      .attr("stroke-width", 30)
      .attr("d", line)
      .style("cursor", "pointer")
      .style("pointer-events", "all"); // Explicitly enable pointer events

    // Visible line (place SECOND, on top)
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 2)
      .attr("d", line)
      .style("pointer-events", "none"); // Disable pointer events so hover path works

    // Tooltip setup
    let tooltip = d3.select("body").select(".line-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body")
        .append("div")
        .attr("class", "line-tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("border-radius", "8px")
        .style("padding", "8px 12px")
        .style("pointer-events", "none")
        .style("font-size", "13px")
        .style("color", "#222")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.1)")
        .style("z-index", 1000)
        .style("display", "none");
    }

    const focusCircle = svg.append("circle")
      .attr("r", 4)
      .attr("fill", "#2563eb")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("display", "none")
      .style("pointer-events", "none"); // Prevent circle from interfering

    hoverPath
      .on("mousemove", function (event) {
        const [mx] = d3.pointer(event);
        const hoveredDate = x.invert(mx);
        const bisectDate = d3.bisector(d => d.date).left;
        let idx = bisectDate(data, hoveredDate);
        
        // Improved bisection logic to handle edge cases
        if (idx === 0) {
          // Before first data point
          const d = data[0];
          showTooltipAndCircle(d, event);
        } else if (idx >= data.length) {
          // After last data point
          const d = data[data.length - 1];
          showTooltipAndCircle(d, event);
        } else {
          // Between data points - find closest
          const d0 = data[idx - 1];
          const d1 = data[idx];
          const d = (hoveredDate - d0.date > d1.date - hoveredDate) ? d1 : d0;
          showTooltipAndCircle(d, event);
        }
      })
      .on("mouseout", function () {
        tooltip.style("display", "none");
        focusCircle.style("display", "none");
      });

    function showTooltipAndCircle(d, event) {
      if (!d) return;
      
      const cx = x(d.date);
      const cy = y(d.cumulativeDistance);

      focusCircle
        .style("display", "block")
        .attr("cx", cx)
        .attr("cy", cy);

      tooltip
        .style("display", "block")
        .html(`<strong>Date:</strong> ${d.date.toLocaleDateString()}<br/>
              <strong>Distance:</strong> ${d.cumulativeDistance.toFixed(1)} km`)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    }


  }, [distances]);
  return (
    <div style={{ fontFamily: 'sans-serif', background: '#fff' }}>
      <h2>Cumulative Distance Over Time</h2>
      <svg ref={svgRef} width={800} height={400}></svg>
      {distances.length === 0 && <p>Loading data...</p>}
    </div>
  );
}

function AutoZoomPolyline({ path }) {
  const map = useMap();

  useEffect(() => {
    if (path.length > 0) {
      const latlngs = path.map(p => [p.lat, p.long]);
      const bounds = latlngs.length > 1 ? latlngs : [[0, 0]];
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [path, map]);

  const speeds = path.map(d => d.speed).filter(s => s != null);
  const minSpeed = Math.min(...speeds);
  const maxSpeed = Math.max(...speeds);

  const colorScale = d3.scaleSequential()
    .domain([maxSpeed, minSpeed]) // reverse: blue = slow, red = fast
    .interpolator(d3.interpolateTurbo);

  return (
    <>
      {path.length > 1 &&
        path.slice(1).map((point, i) => (
          <Polyline
            key={i}
            positions={[
              [path[i].lat, path[i].long],
              [point.lat, point.long]
            ]}
            color={colorScale((path[i].speed + point.speed) / 2)}
            weight={4}
          />
        ))}
    </>
  );
}


function RunningBeeswarm({ setPath, setActivityInfo }) {
  const [distances, setDistances] = useState([]);
  const [selectedCircle, setSelectedCircle] = useState(null);
  const svgRef = useRef();
  
  useEffect(() => {
    fetch('http://localhost:5000/api/running-data')
      .then(res => res.json())
      .then(data => setDistances(data));
  }, []);

  useEffect(() => {
    if (distances.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };

    const data = distances.map(d => ({
      ...d,
      year: new Date(d.start_time).getFullYear(),
      avg_speed: +d.avg_speed,
      distance: +d.distance
    }));

    const r = d3.scaleLinear()
      .domain(d3.extent(data, d => d.distance))
      .range([3, 10]);

    const years = [...new Set(data.map(d => d.year))].sort();

    const y = d3.scalePoint()
      .domain(years)
      .range([margin.top, height - margin.bottom])
      .padding(0.15);

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.avg_speed))
      .nice()
      .range([margin.left, width - margin.right]);

    const simulation = d3.forceSimulation(data)
      .force("x", d3.forceX(d => x(d.avg_speed)).strength(0.1))
      .force("y", d3.forceY(d => y(d.year)).strength(0.1))
      .force("collide", d3.forceCollide(d => r(d.distance)))
      .stop();

    for (let i = 0; i < 200; ++i) simulation.tick();

    svg.attr("viewBox", [0, 0, width, height]);

    let tooltip = d3.select("body").select(".beeswarm-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body")
        .append("div")
        .attr("class", "beeswarm-tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #2563eb")
        .style("border-radius", "8px")
        .style("padding", "8px 12px")
        .style("pointer-events", "none")
        .style("font-size", "14px")
        .style("color", "#222")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.08)")
        .style("z-index", 1000)
        .style("display", "none");
    }

    
svg.selectAll("circle")
  .data(data)
  .join("circle")
  .attr("cx", d => d.x)
  .attr("cy", d => d.y)
  .attr("r", d => r(d.distance))
  .attr("fill", d => selectedCircle === d.activity_id ? "#22d4fb" : "#2563eb") // Light blue for selected, dark blue for others
  .on("mouseover", function (event, d) {
    let pace = "-";
    if (d.avg_speed > 0) {
      const total = 60 / d.avg_speed;
      let min = Math.floor(total);
      let sec = Math.round((total - min) * 60);
      if (sec === 60) {
        min += 1;
        sec = 0;
      }
      pace = `${min}:${sec.toString().padStart(2, '0')}`;
    }
    tooltip
      .style("display", "block")
      .html(`<strong>Distance:</strong> ${d.distance.toFixed(2)} km<br/><strong>Pace:</strong> ${pace} min/km`);
    
    d3.select(this)
      .attr("stroke", "#22d4fb")
      .attr("fill", "#22d4fb") // Light blue on hover
      .attr("stroke-width", 2);
  })
  .on("mousemove", function (event) {
    tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
  })
  .on("mouseout", function (event, d) {
    tooltip.style("display", "none");
    d3.select(this)
      .attr("stroke", null)
      .attr("stroke-width", null)
      .attr("fill", selectedCircle === d.activity_id ? "#22d4fb" : "#2563eb"); // Restore correct color based on selection
  })
      .on("click", function (event, d) {
        // Update selected circle state
        setSelectedCircle(d.activity_id);
        
        fetch(`http://localhost:5000/api/records-by-id=${d.activity_id}`)
          .then(res => res.json())
          .then(json => {
            const coordinates = (json.records || [])
              .filter(p => p.lat != null && p.long != null)
              .map(p => ({ lat: p.lat, long: p.long, speed: p.speed }));
            if (coordinates.length > 0) {
              setPath(coordinates);
              setActivityInfo({
                distance: json.distance,
                avg_speed: json.avg_speed,
                date: json.start_time
              });
            }
          });
      });

      svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom + 40})`)
        .call(d3.axisBottom(x))
        .call(g => g.select(".domain").remove());

      svg.append("g")
        .attr("transform", `translate(0,${margin.top - 40})`)
        .call(d3.axisTop(x))
        .call(g => g.select(".domain").remove());

      svg.append("g")
        .attr("transform", `translate(${margin.left - 20},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove());
  }, [distances, selectedCircle, setPath, setActivityInfo]); // Added selectedCircle to dependencies

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#fff' }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start'}}>
        <div>
          <h2>Running Summary</h2>
          <svg ref={svgRef} width={700} height={500}></svg>
          {distances.length === 0 && <p>Loading data...</p>}
        </div>
      </div>
    </div>
  );
}

function MapLeaflet({ path, activityInfo }) {
  return (
    <div style={{
      fontFamily: 'sans-serif',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: '60px'
    }}>
      {activityInfo && (
        <div style={{ marginBottom: '12px', fontSize: '14px', color: '#111' }}>
          <strong>Distance:</strong> {activityInfo.distance.toFixed(2)} km | <strong>Pace:</strong> {(() => {
              if (activityInfo.avg_speed > 0) {
                const total = 60 / activityInfo.avg_speed;
                let min = Math.floor(total);
                let sec = Math.round((total - min) * 60);
                if (sec === 60) {
                  min += 1;
                  sec = 0;
                }
                return `${min}:${sec.toString().padStart(2, '0')}`;
              }
          })()} min/km | <strong>Date:</strong> {(() => {
            const d = new Date(activityInfo.date);
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
          })()}
        </div>
      )}
      <div style={{
        height: '400px',
        width: '500px',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <MapContainer
          center={[48.8566, 2.3522]}
          zoom={15}
          scrollWheelZoom={true}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <AutoZoomPolyline path={path} />
        </MapContainer>
      </div>
    </div>
  );
}

function RunningSummaryPage() {
  const [path, setPath] = useState([]);
  const [activityInfo, setActivityInfo] = useState(null);

  return (
    <div style={{ display: 'flex', fontFamily: 'sans-serif', height: '100vh', background: '#f8f9fd' }}>
      <aside style={{ width: '60px', background: '#fff', padding: '10px 0', boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}>
        <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginTop: '20px' }}>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}><Home /></NavLink>
          <NavLink to="/health" className={({ isActive }) => isActive ? 'active' : ''}><HeartPulse /></NavLink>
          <NavLink to="/running" className={({ isActive }) => isActive ? 'active' : ''}><Footprints /></NavLink>
          <NavLink to="/sleep" className={({ isActive }) => isActive ? 'active' : ''}><BedDouble /></NavLink>
        </nav>
      </aside>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'row',
          marginLeft: '20px',
          marginTop: '60px',
          padding: '20px',
          width: '850px',
          height: '550px',
        }}>
          <div style={{ minWidth: 0 }}>
            <CumulativeDistance />
          </div>
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'row',
          marginLeft: '20px',
          marginTop: '20px',
          padding: '20px',
          width: '1350px',
          height: '550px',
        }}>
          <div style={{ minWidth: 0 }}>
            <RunningBeeswarm setPath={setPath} setActivityInfo={setActivityInfo} />
          </div>
          <div style={{ minWidth: 0 }}>
            <MapLeaflet path={path} activityInfo={activityInfo} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RunningSummaryPage;