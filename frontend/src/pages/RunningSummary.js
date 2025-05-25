import React, { use, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Home, HeartPulse, BedDouble, Footprints } from 'lucide-react';
import { NavLink } from 'react-router-dom';

function RunningSummary() {
  const [distances, setDistances] = useState([]);
  const svgRef = useRef();

  useEffect(() => {
    // Fetch distances from backend API
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

    // Prepare data with parsed date parts
    const data = distances.map(d => ({
      ...d,
      year: new Date(d.start_time).getFullYear(),
      avg_speed: +d.avg_speed,
      distance: +d.distance
    }));

    const r = d3.scaleLinear()
      .domain(d3.extent(data, d => d.distance))
      .range([3, 10]); // exaggerate more if needed, e.g., [4, 40]

    // const r = d3.scaleSqrt()
    //   .domain(d3.extent(data, d => d.distance))
    //   .range([3, 10]);


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

    // Tooltip div
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
      .attr("r", d => r(d.distance))  // Use scale here
      .attr("fill", "#2563eb")
      .attr("opacity", 0.7)
      .on("mouseover", function (event, d) {
        let pace = "-";
        if (d.avg_speed > 0) {
          const total = 60 / d.avg_speed;
          const min = Math.floor(total);
          const sec = Math.round((total - min) * 60);
          pace = `${min}:${sec.toString().padStart(2, '0')}`;
        }

        tooltip
          .style("display", "block")
          .html(
            `<strong>Distance:</strong> ${d.distance.toFixed(2)} km<br/>
            <strong>Pace:</strong> ${pace} min/km`
          );

        d3.select(this)
          .attr("stroke", "#facc15")
          .attr("stroke-width", 3);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        tooltip.style("display", "none");
        d3.select(this)
          .attr("stroke", null)
          .attr("stroke-width", null);
      });

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom + 40})`)
      .call(d3.axisBottom(x))
      .call(g => g.select(".domain").remove());

    svg.append("g")
      .attr("transform", `translate(0,${margin.top - 20})`)
      .call(d3.axisTop(x))
      .call(g => g.select(".domain").remove());

    svg.append("g")
      .attr("transform", `translate(${margin.left - 20},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove());

  }, [distances]);


  return (
    <div style={{ display: 'flex', fontFamily: 'sans-serif', height: '100vh', background: '#f8f9fd' }}>
      {/* Sidebar */}
      <aside style={{ width: '60px', background: '#fff', padding: '10px 0', boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}>
        <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginTop: '20px' }}>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            <Home />
          </NavLink>
          <NavLink to="/health" className={({ isActive }) => isActive ? 'active' : ''}>
            <HeartPulse />
          </NavLink>
          <NavLink to="/running" className={({ isActive }) => isActive ? 'active' : ''}>
            <Footprints />
          </NavLink>
          <NavLink to="/sleep" className={({ isActive }) => isActive ? 'active' : ''}>
            <BedDouble />
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Running Summary</h2>
        <svg ref={svgRef} width={700} height={500}></svg>
        {distances.length === 0 && <p>Loading data...</p>}
      </div>
    </div>
  );
}

export default RunningSummary;
