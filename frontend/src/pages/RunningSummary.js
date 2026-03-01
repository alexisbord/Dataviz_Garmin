import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Home, HeartPulse, BedDouble, Footprints } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function CumulativeDistance() {
  const [distances, setDistances] = useState([]);
  const [view, setView] = useState("overall");
  const svgRef = useRef();

  useEffect(() => {
    fetch("http://localhost:5000/api/running-activities")
      .then(res => res.json())
      .then(data => setDistances(data));
  }, []);

  useEffect(() => {
    if (distances.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 400;
    const margin = { top: 30, right: 40, bottom: 40, left: 60 };

    svg.attr("viewBox", [0, 0, width, height]);

    const parsed = distances.map(d => ({
      date: new Date(d.start_time),
      distance: +d.distance
    }));

    // =========================
    // OVERALL VIEW
    // =========================
    if (view === "overall") {

      const sorted = parsed.sort((a,b) => a.date - b.date);

      let cumulative = 0;
      sorted.forEach(d => {
        cumulative += d.distance;
        d.cumulative = cumulative;
      });

      const x = d3.scaleTime()
        .domain(d3.extent(sorted, d => d.date))
        .range([margin.left, width - margin.right]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(sorted, d => d.cumulative)])
        .nice()
        .range([height - margin.bottom, margin.top]);

      const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.cumulative));

      svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(6));

      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

      svg.append("path")
        .datum(sorted)
        .attr("fill", "none")
        .attr("stroke", "#2563eb")
        .attr("stroke-width", 2)
        .attr("d", line)
        .attr("opacity", 0)
        .transition()
        .duration(600)
        .attr("opacity", 1);
    }

    // =========================
    // YEARLY VIEW
    // =========================
    if (view === "year") {

      const grouped = d3.group(parsed, d => d.date.getFullYear());

      const x = d3.scaleTime()
        .domain([new Date(2000,0,1), new Date(2000,11,31)])
        .range([margin.left, width - margin.right]);

      let allCumulatives = [];

      grouped.forEach(values => {
        values.sort((a,b) => a.date - b.date);
        let cumulative = 0;
        values.forEach(d => {
          cumulative += d.distance;
          d.cumulative = cumulative;
          d.fakeDate = new Date(2000, d.date.getMonth(), d.date.getDate());
          allCumulatives.push(cumulative);
        });
      });

      const y = d3.scaleLinear()
        .domain([0, d3.max(allCumulatives)])
        .nice()
        .range([height - margin.bottom, margin.top]);

      svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")));

      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      grouped.forEach((values, year) => {

        const line = d3.line()
          .x(d => x(d.fakeDate))
          .y(d => y(d.cumulative));

        svg.append("path")
          .datum(values)
          .attr("fill", "none")
          .attr("stroke", color(year))
          .attr("stroke-width", 2)
          .attr("d", line)
          .attr("opacity", 0)
          .transition()
          .duration(600)
          .attr("opacity", 1);
      });
    }

  }, [distances, view]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Cumulative Distance</h2>
        <button
          onClick={() => setView(view === "overall" ? "year" : "overall")}
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            border: "none",
            background: "#2563eb",
            color: "white",
            cursor: "pointer"
          }}
        >
          {view === "overall" ? "View by Year" : "View Overall"}
        </button>
      </div>

      <svg ref={svgRef} width={800} height={400}></svg>
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
    fetch('http://localhost:5000/api/running-activities')
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
        
        fetch(`http://localhost:5000/api/activities/${d.activity_id}/records`)
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