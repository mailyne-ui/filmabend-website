/* charts.js — D3.js Diagramme */

const FARBEN = {
  rot:      '#C8102E',
  gold:     '#E8C547',
  tiefblau: '#2E3566',
  grau:     '#8B9BB4',
  weiss:    '#FFFFFF'
};

function createTooltip(container) {
  return d3.select(container).append('div').attr('class', 'tooltip');
}

function addChartHeader(container, frage, aussage) {
  const header = document.createElement('div');
  header.className = 'chart-header';

  const title = document.createElement('p');
  title.className = 'chart-header-title';
  title.textContent = frage;
  header.appendChild(title);

  if (aussage) {
    const subtitle = document.createElement('p');
    subtitle.className = 'chart-header-subtitle';
    subtitle.textContent = aussage;
    header.appendChild(subtitle);
  }

  container.insertBefore(header, container.firstChild);
}

function addHtmlLegend(container, items, onHover, onLeave) {
  const legend = document.createElement('div');
  legend.className = 'chart-legend';

  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'chart-legend-item';
    if (onHover) el.style.cursor = 'pointer';

    const dot = document.createElement('span');
    dot.className = 'chart-legend-dot';
    dot.style.background = item.color;

    const label = document.createElement('span');
    label.textContent = item.label;

    el.appendChild(dot);
    el.appendChild(label);

    if (onHover) {
      el.addEventListener('mouseenter', () => onHover(item.key, el));
      el.addEventListener('mouseleave', onLeave);
    }

    legend.appendChild(el);
  });

  container.insertBefore(legend, container.firstChild);
  return legend;
}

function addAxisLabels(svg, innerW, innerH, xLabel, yLabel) {
  svg.append('text')
    .attr('class', 'axis-caption')
    .style('font-family', 'Inter, sans-serif')
    .style('font-size', '11px')
    .style('fill', 'rgba(255,255,255,0.4)')
    .attr('x', innerW)
    .attr('y', innerH + 44)
    .attr('text-anchor', 'end')
    .text(xLabel);

  svg.append('text')
    .attr('class', 'axis-caption')
    .style('font-family', 'Inter, sans-serif')
    .style('font-size', '11px')
    .style('fill', 'rgba(255,255,255,0.4)')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerH)
    .attr('y', -48)
    .attr('text-anchor', 'start')
    .text(yLabel);
}

function addHoverLine(svg, innerW, innerH, xScale, jahrMin, jahrMax, axisGroup, onYear, onLeave) {
  const hoverLine = svg.append('line')
    .attr('class', 'annotation-line')
    .attr('y1', 0).attr('y2', innerH)
    .style('opacity', 0);

  let lastJahr = null;

  function highlightTick(jahr) {
    if (!axisGroup) return;
    axisGroup.selectAll('.tick text')
      .attr('fill', d => d === jahr ? FARBEN.gold : null)
      .attr('font-weight', d => d === jahr ? 600 : null);
  }

  svg.append('rect')
    .attr('class', 'hover-overlay')
    .attr('width', innerW)
    .attr('height', innerH)
    .attr('fill', 'transparent')
    .on('mousemove', function(event) {
      const rawYear = xScale.invert(d3.pointer(event, this)[0]);
      const jahr = Math.round(Math.min(Math.max(rawYear, jahrMin), jahrMax));
      hoverLine.attr('x1', xScale(jahr)).attr('x2', xScale(jahr)).style('opacity', 1);
      if (jahr !== lastJahr) {
        highlightTick(jahr);
        lastJahr = jahr;
      }
      if (onYear) onYear(jahr, event);
    })
    .on('mouseleave', function() {
      hoverLine.style('opacity', 0);
      highlightTick(null);
      lastJahr = null;
      if (onLeave) onLeave();
    });

  return { hoverLine };
}

// ============================================
// CHART 1 — Kapitel 1: Kinodaten 2000–2013
// ============================================
function drawChart1(metric) {
  d3.csv('data/kino_de.csv', d3.autoType).then(data => {
    const filtered = data.filter(d => d.jahr <= 2013);

    const labels = {
      kinobesucher_mio:          'Kinobesucher pro Jahr, in Millionen',
      kinoumsatz_mio_eur:        'Umsatz pro Jahr, in Mio. €',
      durchschn_ticketpreis_eur: 'Ø Ticketpreis pro Kinokarte, in €'
    };

    const titles = {
      kinobesucher_mio:          ['Das Kino dominiert', 'Kinobesucher in Deutschland 2000–2013, in Millionen'],
      kinoumsatz_mio_eur:        ['Stabile Einnahmen, trotz Schwankungen', 'Kinoumsatz in Deutschland 2000–2013, in Mio. €'],
      durchschn_ticketpreis_eur: ['Der Preis steigt – langsam, aber stetig', 'Ø Ticketpreis 2000–2013, in €']
    };

    const maxVal = { kinobesucher_mio: 200, kinoumsatz_mio_eur: 1200, durchschn_ticketpreis_eur: 10 };

    const container = document.getElementById('chart-1');
    const W = Math.max(container.clientWidth, 320);
    const H = 300;
    const margin = { top: 16, right: 30, bottom: 44, left: 65 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    d3.select('#chart-1').selectAll('*').remove();
    addChartHeader(container, titles[metric][0], titles[metric][1]);

    const svg = d3.select('#chart-1')
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([2000, 2013]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, maxVal[metric]]).range([innerH, 0]);

    svg.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(''));

    const xAxis = svg.append('g').attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(7));

    svg.append('g').attr('class', 'axis')
      .call(d3.axisLeft(y).ticks(5));

    addAxisLabels(svg, innerW, innerH, 'Jahr', labels[metric]);

    const area = d3.area()
      .x(d => x(d.jahr)).y0(innerH).y1(d => y(d[metric]))
      .curve(d3.curveCatmullRom);

    svg.append('path').datum(filtered)
      .attr('class', 'chart-area').attr('fill', FARBEN.rot).attr('d', area);

    const line = d3.line()
      .x(d => x(d.jahr)).y(d => y(d[metric]))
      .curve(d3.curveCatmullRom);

    svg.append('path').datum(filtered)
      .attr('class', 'chart-line').attr('stroke', FARBEN.rot).attr('d', line)
      .attr('stroke-dasharray', function() { const l = this.getTotalLength(); return `${l} ${l}`; })
      .attr('stroke-dashoffset', function() { return this.getTotalLength(); })
      .transition().duration(1300).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);

    svg.selectAll('.data-point')
      .data(filtered)
      .enter().append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => x(d.jahr))
      .attr('cy', d => y(d[metric]))
      .attr('r', 3)
      .attr('fill', d => (metric === 'kinobesucher_mio' && d.jahr === 2001) ? FARBEN.gold : FARBEN.rot)
      .attr('stroke', '#1A1F3C')
      .attr('stroke-width', 1.5);

    const tooltip = createTooltip(container);

    addHoverLine(svg, innerW, innerH, x, 2000, 2013, xAxis, (jahr, event) => {
      const d = filtered.find(dd => dd.jahr === jahr);
      if (!d) return;
      tooltip.classed('visible', true)
        .html(`
          <div class="tooltip-year">${d.jahr}</div>
          <div class="tooltip-line"></div>
          <div class="tooltip-row"><span class="tooltip-key">Besucher</span><span class="tooltip-val">${d.kinobesucher_mio} Mio.</span></div>
          <div class="tooltip-row"><span class="tooltip-key">Umsatz</span><span class="tooltip-val">${d.kinoumsatz_mio_eur} Mio. €</span></div>
          <div class="tooltip-row"><span class="tooltip-key">Ticketpreis</span><span class="tooltip-val">${d.durchschn_ticketpreis_eur} €</span></div>
        `)
        .style('left', (event.offsetX + 16) + 'px')
        .style('top', (event.offsetY - 10) + 'px');
    }, () => tooltip.classed('visible', false));

  });
}

// ============================================
// CHART 2 — Kapitel 2: Kino vs. Streaming-Umsatz 2014–2019
// ============================================
function drawChart2() {
  Promise.all([
    d3.csv('data/kino_de.csv', d3.autoType),
    d3.csv('data/streaming_de.csv', d3.autoType)
  ]).then(([kino, streaming]) => {

    const merged = kino
      .filter(d => d.jahr >= 2015 && d.jahr <= 2019)
      .map(d => {
        const s = streaming.find(x => x.jahr === d.jahr);
        return { jahr: d.jahr, kino: d.kinoumsatz_mio_eur, streaming: s ? s.svod_umsatz_mio_eur : null };
      });

    const container = document.getElementById('chart-2');
    const W = Math.max(container.clientWidth, 320);
    const H = 300;
    const margin = { top: 16, right: 30, bottom: 44, left: 70 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    d3.select('#chart-2').selectAll('*').remove();
    addChartHeader(container, 'Streaming holt auf', 'Kinoumsatz vs. Streaming-Umsatz in Deutschland 2014–2019, in Mio. €');
    addHtmlLegend(container, [
      { key: 'kino',      label: 'Kinoumsatz',             color: FARBEN.rot },
      { key: 'streaming', label: 'Streaming-Umsatz (SVoD)', color: '#5B6BC4' }
    ]);

    const svg = d3.select('#chart-2')
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([2014, 2019]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, 1300]).range([innerH, 0]);

    svg.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(''));

    const xAxis = svg.append('g').attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(6));

    svg.append('g').attr('class', 'axis')
      .call(d3.axisLeft(y).tickFormat(d => d).ticks(5));

    addAxisLabels(svg, innerW, innerH, 'Jahr', 'Umsatz pro Jahr, in Mio. €');

    const lineKino = d3.line().x(d => x(d.jahr)).y(d => y(d.kino)).curve(d3.curveCatmullRom);
    svg.append('path').datum(merged).attr('class', 'chart-line').attr('stroke', FARBEN.rot).attr('d', lineKino);

    const lineStreaming = d3.line().x(d => x(d.jahr)).y(d => y(d.streaming)).curve(d3.curveCatmullRom);
    svg.append('path').datum(merged)
      .attr('class', 'chart-line').attr('stroke', '#5B6BC4').attr('stroke-width', 3).attr('d', lineStreaming)
      .attr('stroke-dasharray', function() { const len = this.getTotalLength(); return `${len} ${len}`; })
      .attr('stroke-dashoffset', function() { return this.getTotalLength(); })
      .transition().duration(1800).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);

    // Labels bei 2016 platzieren — dort liegen die Linien weit auseinander
    const labelYear = merged.find(d => d.jahr === 2016);
    if (labelYear) {
      svg.append('text')
        .style('font-family', 'Inter, sans-serif').style('font-size', '11px')
        .style('font-weight', '600').style('fill', FARBEN.rot)
        .attr('x', x(2016) - 4).attr('y', y(labelYear.kino) - 22)
        .attr('text-anchor', 'middle')
        .text('Kinoumsatz');

      svg.append('text')
        .style('font-family', 'Inter, sans-serif').style('font-size', '11px')
        .style('font-weight', '600').style('fill', '#5B6BC4')
        .attr('x', x(2016) - 4).attr('y', y(labelYear.streaming) + 30)
        .attr('text-anchor', 'middle')
        .text('Streaming-Umsatz');
    }

    merged.forEach(d => {
      [{ key: 'kino', color: FARBEN.rot }, { key: 'streaming', color: '#5B6BC4' }].forEach(serie => {
        svg.append('circle')
          .attr('class', 'data-point')
          .attr('cx', x(d.jahr)).attr('cy', y(d[serie.key]))
          .attr('r', 3).attr('fill', serie.color).attr('stroke', '#12162A').attr('stroke-width', 1.5);
      });
    });

    const tooltip = createTooltip(container);
    addHoverLine(svg, innerW, innerH, x, 2014, 2019, xAxis, (jahr, event) => {
      if (jahr === 2014) {
        tooltip.classed('visible', true)
          .html(`<div class="tooltip-year">2014</div><div class="tooltip-line"></div><div class="tooltip-row"><span class="tooltip-key">Ereignis</span><span class="tooltip-val">Netflix-Start in DE</span></div>`)
          .style('left', (event.offsetX + 16) + 'px').style('top', (event.offsetY - 10) + 'px');
        return;
      }
      const d = merged.find(dd => dd.jahr === jahr);
      if (!d) return;
      tooltip.classed('visible', true)
        .html(`
          <div class="tooltip-year">${d.jahr}</div>
          <div class="tooltip-line"></div>
          <div class="tooltip-row"><span class="tooltip-key">Kinoumsatz</span><span class="tooltip-val">${d.kino} Mio. €</span></div>
          <div class="tooltip-row"><span class="tooltip-key">Streaming-Umsatz</span><span class="tooltip-val">${d.streaming} Mio. €</span></div>
        `)
        .style('left', (event.offsetX + 16) + 'px').style('top', (event.offsetY - 10) + 'px');
    }, () => tooltip.classed('visible', false));

  });
}

// ============================================
// CHART 3 — Kapitel 3: Corona-Einbruch 2017–2023
// ============================================
function drawChart3() {
  d3.csv('data/kino_de.csv', d3.autoType).then(data => {
    const filtered = data.filter(d => d.jahr >= 2017 && d.jahr <= 2023);

    const container = document.getElementById('chart-3');
    const W = Math.max(container.clientWidth, 320);
    const H = 300;
    const margin = { top: 16, right: 30, bottom: 44, left: 65 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    d3.select('#chart-3').selectAll('*').remove();
    addChartHeader(container, 'Der tiefste Einbruch der Zeitreihe', 'Kinobesucher in Deutschland 2017–2023, in Millionen');

    const svg = d3.select('#chart-3')
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([2017, 2023]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, 140]).range([innerH, 0]);

    svg.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(''));

    svg.append('rect').attr('class', 'year-highlight')
      .attr('x', x(2019.5)).attr('width', x(2021.5) - x(2019.5)).attr('y', 0).attr('height', innerH);

    const xAxis = svg.append('g').attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(7));

    svg.append('g').attr('class', 'axis')
      .call(d3.axisLeft(y).tickFormat(d => d).ticks(5));

    addAxisLabels(svg, innerW, innerH, 'Jahr', 'Kinobesucher pro Jahr, in Millionen');

    const line = d3.line()
      .x(d => x(d.jahr)).y(d => y(d.kinobesucher_mio)).curve(d3.curveCatmullRom);

    svg.append('path').datum(filtered)
      .attr('class', 'chart-line').attr('stroke', FARBEN.rot).attr('d', line)
      .attr('stroke-dasharray', function() { const len = this.getTotalLength(); return `${len} ${len}`; })
      .attr('stroke-dashoffset', function() { return this.getTotalLength(); })
      .transition().duration(1800).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);

    svg.selectAll('.data-point')
      .data(filtered).enter().append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => x(d.jahr)).attr('cy', d => y(d.kinobesucher_mio))
      .attr('r', d => d.corona ? 5 : 3)
      .attr('fill', d => d.corona ? FARBEN.rot : FARBEN.grau)
      .attr('stroke', '#1A1F3C').attr('stroke-width', 1.5);

    const tooltip = createTooltip(container);
    addHoverLine(svg, innerW, innerH, x, 2017, 2023, xAxis, (jahr, event) => {
      const d = filtered.find(dd => dd.jahr === jahr);
      if (!d) return;
      tooltip.classed('visible', true)
        .html(`
          <div class="tooltip-year">${d.jahr}</div>
          <div class="tooltip-line"></div>
          <div class="tooltip-row"><span class="tooltip-key">Besucher</span><span class="tooltip-val ${d.corona ? 'neg' : ''}">${d.kinobesucher_mio} Mio.</span></div>
          <div class="tooltip-row"><span class="tooltip-key">Umsatz</span><span class="tooltip-val">${d.kinoumsatz_mio_eur} Mio. €</span></div>
        `)
        .style('left', (event.offsetX + 16) + 'px').style('top', (event.offsetY - 10) + 'px');
    }, () => tooltip.classed('visible', false));

  });
}

// ============================================
// CHART 4 — Kapitel 4: Neue Normalität ab 2019
// ============================================
function drawChart4(metric) {
  d3.csv('data/kino_de.csv', d3.autoType).then(data => {
    const filtered = data.filter(d => d.jahr >= 2019);

    const labels = {
      kinobesucher_mio:          'Kinobesucher pro Jahr, in Millionen',
      kinoumsatz_mio_eur:        'Umsatz pro Jahr, in Mio. €',
      durchschn_ticketpreis_eur: 'Ø Ticketpreis pro Kinokarte, in €'
    };

    const titles = {
      kinobesucher_mio:          ['Das Publikum kommt zurück', 'Kinobesucher in Deutschland 2019–2025, in Millionen'],
      kinoumsatz_mio_eur:        ['Höhere Preise stützen den Umsatz', 'Kinoumsatz in Deutschland 2019–2025, in Mio. €'],
      durchschn_ticketpreis_eur: ['Kino wird teurer', 'Ø Ticketpreis 2019–2025, in €']
    };

    const container = document.getElementById('chart-4');
    const W = Math.max(container.clientWidth, 320);
    const H = 300;
    const margin = { top: 16, right: 30, bottom: 44, left: 70 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    d3.select('#chart-4').selectAll('*').remove();
    addChartHeader(container, titles[metric][0], titles[metric][1]);

    const svg = d3.select('#chart-4')
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(filtered.map(d => d.jahr)).range([0, innerW]).padding(0.35);
    const y = d3.scaleLinear().domain([0, d3.max(filtered, d => d[metric]) * 1.15]).range([innerH, 0]);

    svg.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(''));

    const coronaYears = filtered.filter(d => d.corona);
    coronaYears.forEach(cy => {
      svg.append('rect').attr('class', 'year-highlight')
        .attr('x', x(cy.jahr) - (x.step() * 0.175)).attr('width', x.step())
        .attr('y', 0).attr('height', innerH);
    });

    const xAxis = svg.append('g').attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x));

    svg.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5));

    addAxisLabels(svg, innerW, innerH, 'Jahr', labels[metric]);

    svg.selectAll('.bar').data(filtered).enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.jahr)).attr('width', x.bandwidth())
      .attr('y', innerH).attr('height', 0)
      .attr('fill', d => d.corona ? FARBEN.rot : FARBEN.tiefblau)
      .attr('rx', 3).style('pointer-events', 'none')
      .transition().duration(800).ease(d3.easeCubicOut)
      .attr('y', d => y(d[metric])).attr('height', d => innerH - y(d[metric]));

    const tooltip = createTooltip(container);
    const hoverLine = svg.append('line')
      .attr('class', 'annotation-line').attr('y1', 0).attr('y2', innerH).style('opacity', 0);

    filtered.forEach(d => {
      svg.append('rect')
        .attr('x', x(d.jahr) - x.step() * 0.175).attr('width', x.step())
        .attr('y', 0).attr('height', innerH).attr('fill', 'transparent')
        .on('mouseover', function(event) {
          hoverLine.attr('x1', x(d.jahr) + x.bandwidth() / 2).attr('x2', x(d.jahr) + x.bandwidth() / 2).style('opacity', 1);
          xAxis.selectAll('.tick text')
            .attr('fill', dd => dd === d.jahr ? FARBEN.gold : null)
            .attr('font-weight', dd => dd === d.jahr ? 600 : null);
          tooltip.classed('visible', true)
            .html(`
              <div class="tooltip-year">${d.jahr}</div>
              <div class="tooltip-line"></div>
              <div class="tooltip-row"><span class="tooltip-key">${labels[metric]}</span><span class="tooltip-val">${d[metric]}</span></div>
            `)
            .style('left', (event.offsetX + 16) + 'px').style('top', (event.offsetY - 10) + 'px');
        })
        .on('mouseleave', function() {
          hoverLine.style('opacity', 0);
          xAxis.selectAll('.tick text').attr('fill', null).attr('font-weight', null);
          tooltip.classed('visible', false);
        });
    });

  });
}

// ============================================
// CHART 4b — Kapitel 4: Kino vs. Streaming-Umsatz 2019–2025
// ============================================
function drawChart4b() {
  Promise.all([
    d3.csv('data/kino_de.csv', d3.autoType),
    d3.csv('data/streaming_de.csv', d3.autoType)
  ]).then(([kino, streaming]) => {

    const merged = kino
      .filter(d => d.jahr >= 2019 && d.jahr <= 2025)
      .map(d => {
        const s = streaming.find(x => x.jahr === d.jahr);
        return { jahr: d.jahr, kino: d.kinoumsatz_mio_eur, streaming: s ? s.svod_umsatz_mio_eur : null };
      })
      .filter(d => d.streaming !== null);

    const container = document.getElementById('chart-4b');
    const W = Math.max(container.clientWidth, 320);
    const H = 300;
    const margin = { top: 16, right: 30, bottom: 44, left: 70 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    d3.select('#chart-4b').selectAll('*').remove();
    addChartHeader(container, 'Streaming hat Kino längst überholt', 'Kinoumsatz vs. Streaming-Umsatz in Deutschland 2019–2025, in Mio. €');
    addHtmlLegend(container, [
      { key: 'kino',      label: 'Kinoumsatz',             color: FARBEN.rot },
      { key: 'streaming', label: 'Streaming-Umsatz (SVoD)', color: '#5B6BC4' }
    ]);

    const svg = d3.select('#chart-4b')
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([2019, 2025]).range([0, innerW]);
    const maxVal = d3.max(merged, d => Math.max(d.kino, d.streaming)) * 1.15;
    const y = d3.scaleLinear().domain([0, maxVal]).range([innerH, 0]);

    svg.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(''));

    const xAxis = svg.append('g').attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(7));

    svg.append('g').attr('class', 'axis')
      .call(d3.axisLeft(y).tickFormat(d => d).ticks(5));

    addAxisLabels(svg, innerW, innerH, 'Jahr', 'Umsatz pro Jahr, in Mio. €');

    // Corona-Hintergrund 2020–2021
    svg.append('rect').attr('class', 'year-highlight')
      .attr('x', x(2019.5)).attr('width', x(2021.5) - x(2019.5))
      .attr('y', 0).attr('height', innerH);

    const lineKino = d3.line().x(d => x(d.jahr)).y(d => y(d.kino)).curve(d3.curveCatmullRom);
    svg.append('path').datum(merged).attr('class', 'chart-line').attr('stroke', FARBEN.rot).attr('d', lineKino)
      .attr('stroke-dasharray', function() { const l = this.getTotalLength(); return `${l} ${l}`; })
      .attr('stroke-dashoffset', function() { return this.getTotalLength(); })
      .transition().duration(1300).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);

    const lineStreaming = d3.line().x(d => x(d.jahr)).y(d => y(d.streaming)).curve(d3.curveCatmullRom);
    svg.append('path').datum(merged)
      .attr('class', 'chart-line').attr('stroke', '#5B6BC4').attr('stroke-width', 3).attr('d', lineStreaming)
      .attr('stroke-dasharray', function() { const l = this.getTotalLength(); return `${l} ${l}`; })
      .attr('stroke-dashoffset', function() { return this.getTotalLength(); })
      .transition().duration(1800).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);

    // Statische Punkte
    merged.forEach(d => {
      [{ key: 'kino', color: FARBEN.rot }, { key: 'streaming', color: '#5B6BC4' }].forEach(serie => {
        svg.append('circle')
          .attr('class', 'data-point')
          .attr('cx', x(d.jahr)).attr('cy', y(d[serie.key]))
          .attr('r', 3).attr('fill', serie.color).attr('stroke', '#12162A').attr('stroke-width', 1.5);
      });
    });

    // Labels bei 2021 — dort ist der Abstand groß und gut lesbar
    const labelYear = merged.find(d => d.jahr === 2021);
    if (labelYear) {
      svg.append('text')
        .style('font-family', 'Inter, sans-serif').style('font-size', '11px')
        .style('font-weight', '600').style('fill', FARBEN.rot)
        .attr('x', x(2021)).attr('y', y(labelYear.kino) - 22)
        .attr('text-anchor', 'middle').text('Kinoumsatz');

      svg.append('text')
        .style('font-family', 'Inter, sans-serif').style('font-size', '11px')
        .style('font-weight', '600').style('fill', '#5B6BC4')
        .attr('x', x(2021)).attr('y', y(labelYear.streaming) + 30)
        .attr('text-anchor', 'middle').text('Streaming-Umsatz');
    }

    const tooltip = createTooltip(container);
    addHoverLine(svg, innerW, innerH, x, 2019, 2025, xAxis, (jahr, event) => {
      const d = merged.find(dd => dd.jahr === jahr);
      if (!d) return;
      tooltip.classed('visible', true)
        .html(`
          <div class="tooltip-year">${d.jahr}</div>
          <div class="tooltip-line"></div>
          <div class="tooltip-row"><span class="tooltip-key">Kinoumsatz</span><span class="tooltip-val">${d.kino} Mio. €</span></div>
          <div class="tooltip-row"><span class="tooltip-key">Streaming-Umsatz</span><span class="tooltip-val">${d.streaming} Mio. €</span></div>
        `)
        .style('left', (event.offsetX + 16) + 'px')
        .style('top', (event.offsetY - 10) + 'px');
    }, () => tooltip.classed('visible', false));

  });
}

// ============================================
// CHART 5 — Kapitel 5: Prognose T/S/A-VoD bis 2029
// ============================================
function drawChart5() {
  d3.csv('data/streaming_de.csv', d3.autoType).then(data => {

    const container = document.getElementById('chart-5');
    const W = Math.max(container.clientWidth, 320);
    const H = 320;
    const margin = { top: 16, right: 30, bottom: 44, left: 70 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    d3.select('#chart-5').selectAll('*').remove();
    addChartHeader(container, 'Streaming wächst – in allen Varianten', 'Umsatzentwicklung nach Streaming-Typ in Deutschland 2012–2024 und Prognose bis 2029, in Mrd. €');

    const svg = d3.select('#chart-5')
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([2012, 2029]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, 7000]).range([innerH, 0]);

    svg.append('g').attr('class', 'grid').call(d3.axisLeft(y).tickSize(-innerW).tickFormat(''));

    const xAxis = svg.append('g').attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(9));

    svg.append('g').attr('class', 'axis')
      .call(d3.axisLeft(y).tickFormat(d => (d / 1000)).ticks(5));

    addAxisLabels(svg, innerW, innerH, 'Jahr', 'Umsatz pro Jahr, in Mrd. €');

    const stackKeys = ['tvod_pwc_mio_eur', 'svod_pwc_mio_eur', 'avod_pwc_mio_eur'];
    const stack = d3.stack().keys(stackKeys).value((d, key) => d[key] || 0);
    const series = stack(data);

    const colors = {
      tvod_pwc_mio_eur: FARBEN.grau,
      svod_pwc_mio_eur: '#5B6BC4',
      avod_pwc_mio_eur: FARBEN.gold
    };

    const vodInfo = {
      tvod_pwc_mio_eur: { name: 'T-VoD (Transactional VoD)', desc: 'Einzelabruf: Du zahlst pro Film oder Serie, wie beim digitalen Videoverleih.' },
      svod_pwc_mio_eur: { name: 'S-VoD (Subscription VoD)', desc: 'Abo-Modelle wie Netflix oder Disney+: ein monatlicher Betrag für die gesamte Bibliothek.' },
      avod_pwc_mio_eur: { name: 'A-VoD (Advertising-based VoD)', desc: 'Werbefinanziert und kostenlos, z. B. YouTube oder Pluto TV.' }
    };

    const area = d3.area()
      .x(d => x(d.data.jahr)).y0(d => y(d[0])).y1(d => y(d[1]))
      .curve(d3.curveCatmullRom).defined(d => !isNaN(d[1]));

    const segmentPaths = {};

    series.forEach(s => {
      const group = svg.append('g').attr('data-key', s.key);
      group.append('path').datum(s.filter(d => d.data.jahr <= 2024))
        .attr('class', 'segment-area').attr('fill', colors[s.key]).attr('opacity', 0.75).attr('d', area);
      group.append('path').datum(s.filter(d => d.data.jahr >= 2024))
        .attr('class', 'segment-area').attr('fill', colors[s.key]).attr('opacity', 0.3).attr('d', area);
      segmentPaths[s.key] = group;
    });

    svg.append('line').attr('class', 'annotation-line')
      .attr('x1', x(2024)).attr('x2', x(2024)).attr('y1', 0).attr('y2', innerH);

    const vodTooltip = d3.select(container).append('div').attr('class', 'vod-tooltip');

    function dimOthers(activeKey) {
      stackKeys.forEach(key => {
        segmentPaths[key].selectAll('.segment-area').transition().duration(150)
          .attr('opacity', key === activeKey ? 0.85 : 0.1);
      });
    }

    function resetDim() {
      stackKeys.forEach(key => {
        segmentPaths[key].selectAll('.segment-area').transition().duration(150)
          .attr('opacity', (d, i) => i === 0 ? 0.75 : 0.3);
      });
    }

    addHtmlLegend(container, [
      { key: 'tvod_pwc_mio_eur', label: 'T-VoD', color: FARBEN.grau },
      { key: 'svod_pwc_mio_eur', label: 'S-VoD', color: '#5B6BC4' },
      { key: 'avod_pwc_mio_eur', label: 'A-VoD', color: FARBEN.gold }
    ], (key, el) => {
      dimOthers(key);
      const info = vodInfo[key];
      vodTooltip.classed('visible', true)
        .html(`<strong>${info.name}</strong>${info.desc}`)
        .style('left', el.getBoundingClientRect().left - container.getBoundingClientRect().left + 'px')
        .style('top', '80px');
    }, () => {
      resetDim();
      vodTooltip.classed('visible', false);
    });

    const tooltip = createTooltip(container);
    addHoverLine(svg, innerW, innerH, x, 2012, 2029, xAxis, (jahr, event) => {
      const d = data.find(dd => dd.jahr === jahr);
      if (!d) return;
      tooltip.classed('visible', true)
        .html(`
          <div class="tooltip-year">${d.jahr}${d.prognose ? ' (Prognose)' : ''}</div>
          <div class="tooltip-line"></div>
          <div class="tooltip-row"><span class="tooltip-key">S-VoD</span><span class="tooltip-val">${d.svod_pwc_mio_eur || '–'} Mio. €</span></div>
          <div class="tooltip-row"><span class="tooltip-key">A-VoD</span><span class="tooltip-val">${d.avod_pwc_mio_eur || '–'} Mio. €</span></div>
          <div class="tooltip-row"><span class="tooltip-key">T-VoD</span><span class="tooltip-val">${d.tvod_pwc_mio_eur || '–'} Mio. €</span></div>
        `)
        .style('left', (event.offsetX + 16) + 'px').style('top', '10px');
    }, () => tooltip.classed('visible', false));

  });
}
