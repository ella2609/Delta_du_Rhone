// Création de la fonction qui permet d'afficher les données des carottes en cliquant sur les points //
function onPointClick(carotte) {
  

  // Définir dans lequel des sub-container les données sont affichées //
  const subContainer1 = d3.select("#sub-container-1");
  const subContainer2 = d3.select("#sub-container-2");
  const subContainer3 = d3.select("#sub-container-3");

  // Vider les sous-conteneurs pour chaque nouveau clique // 
  subContainer1.selectAll("*").remove();
  subContainer2.selectAll("*").remove();
  subContainer3.selectAll("*").remove();

  // Charger le fichier carottes.csv //
  d3.dsv(";", "Data/carottes.csv").then(data => {
    const carotteData = data.filter(d => d.Nom && d.Nom.trim().toLowerCase() === carotte.trim().toLowerCase());

    if (carotteData.length === 0) {
      subContainer1.html('<p class ="info-title"> Aucune donnée disponible pour cette carotte.</p>');
      console.warn("Aucune donnée trouvée pour la carotte :", carotte);
      return;
    }

    // Charger le fichier Infos_carottes.csv //
    d3.dsv(";", "Data/Infos_carottes.csv").then(infoData => {
      const carotteInfo = infoData.find(d => d.Name && d.Name.trim().toLowerCase() === carotte.trim().toLowerCase());

      if (!carotteInfo) {
        subContainer1.html('<p class ="info-title">Aucune information disponible pour cette carotte.</p>');
        return;
      }

    // Charger le fichier datations.csv //
    d3.dsv(";", "Data/datations.csv").then(datationsData => {
        const datations = datationsData.filter(d => d.Core_Name && d.Core_Name.trim().toLowerCase() === carotte.trim().toLowerCase());


      // Adaptation des données pour pouvoir les afficher correctement //
      carotteData.forEach(d => {
        d.profondeur_haut = parseFloat(d.Top_depth.replace(",", ".")) || 0;
        d.profondeur_bas = parseFloat(d.Bottom_depth.replace(",", ".")) || 0;
        d.hauteur = parseFloat(d.Taille_unit.replace(",", ".")) || 0;
      });

      // Trier les données par leur profondeur pour avoir l'affichage dans le bon ordre //
      carotteData.sort((a, b) => a.profondeur_haut - b.profondeur_haut);

      const profondeurMax = d3.max(carotteData, d => d.profondeur_bas);

      const svgWidth = 600;
      // Définition que si une corotte est de taille supérieure à 15 mètres que le barplot sera plus grand //
      const hasLargeUnit = carotteData.some(d => profondeurMax > 15);
      const svgHeight = hasLargeUnit ? 1700 : 500;
      // Définition que si une carotte est de taille supérieure à 40 mètres que le barplot sera encore plus grand //
      const isVeryLargeUnit = carotteData.some(d => profondeurMax > 40);
      const svgHeightVeryLarge = isVeryLargeUnit ? 2000 : svgHeight;

      // Définition du titre dans sub-container-1 //
      const titleSvg = subContainer1.append("svg")
        .attr("width", svgWidth)
        .attr("height", 200);

      // Définition des informations dans le sub-container-1 en-dessous du titre //
      const infoLines = [
        `Site de carottage : ${carotteInfo.Name}`,
        `${carotteInfo.Source} `,
        `${carotteInfo.Nbr_Dates} dates`,
        `Mission : ${carotteInfo.Mission_Projet}`,
        `Altitude : ${carotteInfo.Altitude} mètres`,
        `Nombre d'unités : ${carotteData.length}`,
        `Profondeur maximale : ${profondeurMax} m`
      ];

      // Affichage du titre et des informations dans le sub-container-1 //
      titleSvg.selectAll("text")
        .data(infoLines)
        .enter()
        .append("text")
        .attr("class", (d, i) => i === 0 ? "chart-title" : "info-label")
        .attr("x", svgWidth / 2)
        .attr("y", (d, i) => 70 + i * 15)
        .attr("text-anchor", "middle")
        .each(function(d, i) {
          if (i === 1) { // Pour ajouter un lien pour la source //
            const link = d3.select(this.parentNode)
              .append("a")
              .attr("xlink:href", carotteInfo.Lien)
              .attr("target", "_blank");

            link.append("text")
              .attr("class", "lien-source")
              .attr("x", svgWidth / 2)
              .attr("y", 70 + i * 15)
              .attr("text-anchor", "middle")
              .text(carotteInfo.Source);
          } else {
            d3.select(this).text(d);
          }
        });


      // Définition du sub-container-2 //
      const svg = subContainer2.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

        
      const yScale = d3.scaleLinear()
        .domain([0, profondeurMax])
        .range([0, svgHeight - 100]);

      const color = d3.scaleOrdinal(d3.schemeSet3);

      // Fonction pour déterminer la couleur selon l'environnement //
      function getColor(env) {
        if (!env) return "#cccccc";
        const e = env.toLowerCase();

        //  Définition des couleurs //
        const colorFresh = "#52b432";      
        const colorTerrestrial = "#8B5A2B";
        const colorBrackish = "#ba9cd4";
        const colorMarine = "#83d0e9";

        // Détection de quel environnement est présent dans l'unité //
        const isFresh = e.includes("freshwater");
        const isTerrestrial = e.includes("terrestrial");
        const isBrackish = e.includes("brackish");
        const isMarine = e.includes("marin") || e.includes("marine");

        // Cas d'un environnement unique //
        if (isFresh && !isTerrestrial && !isBrackish && !isMarine) return colorFresh;
        if (!isFresh && isTerrestrial && !isBrackish && !isMarine) return colorTerrestrial;
        if (!isFresh && !isTerrestrial && isBrackish && !isMarine) return colorBrackish;
        if (!isFresh && !isTerrestrial && !isBrackish && isMarine) return colorMarine;

        // Cas de plusieurs environnements //
        let colors = [];
        if (isFresh) colors.push(colorFresh);
        if (isTerrestrial) colors.push(colorTerrestrial);
        if (isBrackish) colors.push(colorBrackish);
        if (isMarine) colors.push(colorMarine);

        if (colors.length > 1) {
          let r = 0, g = 0, b = 0;
          colors.forEach(col => {
            const c = d3.color(col);
            r += c.r;
            g += c.g;
            b += c.b;
          });
          r = Math.round(r / colors.length);
          g = Math.round(g / colors.length);
          b = Math.round(b / colors.length);
          return `rgb(${r},${g},${b})`;
        }

        return "#cccccc";
      }

      // Fonction pour déterminer le motif selon la granulométrie //
      function getPattern(Grain_size) {
        if (!Grain_size) return null;
        const g = Grain_size.toLowerCase();
        if (g.includes("gravel")) return "url(#gravel-pattern)";
        if (g.includes("sandy silt")) return "url(#sandysilt-pattern)";
        if (g.includes("sand") && g.includes("silt")) return "url(#sandysilt-pattern)";
        if (g.includes("sand")) return "url(#sand-pattern)";
        if (g.includes("silt")) return "url(#silt-pattern)";
        return null;
      }

      // Définition des motifs pour les faciès //
      const defs = svg.append("defs");

      // Motif pour "Sand" //
      defs.append("pattern")
        .attr("id", "sand-pattern")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 6)
        .attr("height", 6)
        .append("circle")
        .attr("cx", 3)
        .attr("cy", 3)
        .attr("r", 1)
        .attr("fill", "black");

      // Motif pour "Silt" //
      const siltPattern = defs.append("pattern")
        .attr("id", "silt-pattern")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 6)
        .attr("height", 6);

      siltPattern.append("line")
        .attr("x1", 0).attr("y1", 1)
        .attr("x2", 3).attr("y2", 1)
        .attr("stroke", "black").attr("stroke-width", 1);

      siltPattern.append("line")
        .attr("x1", 3).attr("y1", 4)
        .attr("x2", 6).attr("y2", 4)
        .attr("stroke", "black").attr("stroke-width", 1);

      // Motif pour "Sandy Silt" //
      const sandySiltPattern = defs.append("pattern")
        .attr("id", "sandysilt-pattern")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 8)
        .attr("height", 8);

        // Ligne courte à gauche //
        sandySiltPattern.append("line")
          .attr("x1", 0).attr("y1", 4)
          .attr("x2", 2).attr("y2", 4)
          .attr("stroke", "black").attr("stroke-width", 1.2);

        // Point au centre //
        sandySiltPattern.append("circle")
          .attr("cx", 4).attr("cy", 4)
          .attr("r", 1)
          .attr("fill", "black");

        // Ligne courte à droite //
        sandySiltPattern.append("line")
          .attr("x1", 6).attr("y1", 4)
          .attr("x2", 8).attr("y2", 4)
          .attr("stroke", "black").attr("stroke-width", 1.2);

      // Motif pour "Gravel" //
      defs.append("pattern")
        .attr("id", "gravel-pattern")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 10)
        .attr("height", 10)
        .append("circle")
        .attr("cx", 5)
        .attr("cy", 5)
        .attr("r", 2)
        .attr("fill", "black");


      // Fond couleur selon l'environnement //
      svg.selectAll("rect.env")
        .data(carotteData)
        .enter()
        .append("rect")
        .attr("class", "env")
        .attr("x", 50)
        .attr("y", d => yScale(d.profondeur_haut) + 20)
        .attr("width", 50)
        .attr("height", d => yScale(d.profondeur_bas) - yScale(d.profondeur_haut))
        .attr("fill", d => getColor(d.Environment))
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .append("title")
        .text(d => `Unité : ${d.Unit}\nProfondeur haut : ${d.Top_depth} mètres\nProfondeur bas : ${d.Bottom_depth} mètres\nGrain : ${d.Grain_size}\nEnvironnement : ${d.Environment}`);

      // Texture SVG selon la granulométrie (par-dessus) //
      svg.selectAll("rect.grain")
        .data(carotteData)
        .enter()
        .append("rect")
        .attr("class", "grain")
        .attr("x", 50)
        .attr("y", d => yScale(d.profondeur_haut) + 20)
        .attr("width", 50)
        .attr("height", d => yScale(d.profondeur_bas) - yScale(d.profondeur_haut))
        .attr("fill", d => getPattern(d.Grain_size))
        .attr("pointer-events", "none")
        .attr("opacity", 0.5)
        .attr("patternTransform", d => {
          const x = 50; 
          const y = yScale(d.profondeur_haut) + 20;
          return `translate(${-x},${-y})`;
        });


      // Affichage de l'échelle à gauche du Barplot //
      const yAxis = d3.axisLeft(yScale)
        .ticks(10)
        .tickFormat(d => d + " m");

      svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", "translate(50, 20)")
        .call(yAxis);

      // Affichage des Labels des unités du Barplot //
      svg.selectAll("text.unit-label")
        .data(carotteData)
        .enter()
        .append("text")
        .attr("class", "unit-label")
        .attr("x", 110)
        .attr("y", d => yScale(d.profondeur_haut + d.hauteur / 2) + 25)
        .attr("text-anchor", "middle")
        .text(d => d.Unit);

      // Affichage du texte dans la partie description du sub-container-2 //        
      svg.selectAll("g.text-block-description")
        .data(carotteData)
        .enter()
        .append("g")
        .attr("class", "text-block-description")
        .attr("transform", d => {
          const yMiddle = yScale(d.profondeur_haut + d.hauteur / 2) + 20;
          return `translate(250, ${yMiddle})`;
        })
        .each(function(d) {
          const group = d3.select(this);
          const details = [
            (d.Facies),
            d.Comments_environement
          ];
          group.selectAll("text")
            .data(details)
            .enter()
            .append("text")
            .attr("x", 0)
            .attr("y", (d, i) => i * 15)
            .attr("class", "details-label")
            .each(function(text) {
              const lines = wrapText(text || "", 180);
              lines.forEach((line, i) => {
                d3.select(this)
                  .append("tspan")
                  .attr("x", 0)
                  .attr("dy", i === 0 ? 0 : 13)
                  .text(line);
              });
            });
        });

      // Affichage du texte dans la partie interprétation du sub-container-2 //
      svg.selectAll("g.text-block-environment")
              .data(carotteData)
              .enter()
              .append("g")
              .attr("class", "text-block-environment")
              .attr("transform", d => {
                const yMiddle = yScale(d.profondeur_haut + d.hauteur / 2) + 20;
                return `translate(440, ${yMiddle})`;
              })
              .each(function(d) {
                const group = d3.select(this);
                const details = [
                  (d.Depostinional_environment_1 || '') + (d.Depostinional_environment_2 ? ' / ' + d.Depostinional_environment_2 : ''),
                  d.Interpretation_comments || ''
                ];
                group.selectAll("text")
                  .data(details)
                  .enter()
                  .append("text")
                  .attr("x", 0)
                  .attr("y", (d, i) => i * 15)
                  .attr("class", "details-label")
                  .each(function(text) {
                    const lines = wrapText(text || "", 180);
                    lines.forEach((line, i) => {
                      d3.select(this)
                        .append("tspan")
                        .attr("x", 0)
                        .attr("dy", i === 0 ? 0 : 13)
                        .text(line);
                    });
                  });
              });
              
      // Affichage des titres pour les 3 blocs dans le sub-container-2 //
      svg.append("text")
        .attr("x", 75)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .attr("class", "info-title")
        .text("Log");

      svg.append("text")
        .attr("x", 250)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .attr("class", "info-title")
        .text("Description (Faciès)");

      svg.append("text")
        .attr("x", 440)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .attr("class", "info-title")
        .text("Interprétation");

      // Ajoute les points de datation à gauche du barplot //
      svg.selectAll("circle.datation-point")
        .data(datations)
        .enter()
        .append("circle")
        .attr("class", "datation-point")
        .attr("cx", 50)
        .attr("cy", d => yScale(parseFloat(d.depth.replace(",", "."))) + 20)
        .attr("r", 7) 
        .append("title")
        .text(d => `Méthode : ${d.Dating_methods}\nProfondeur : ${d.depth} m\nÂge BP : ${d.C14_BP_not_calibrated} ±${d.C14_BP_Uncertainty}`);

      // Légende du sub-container-3 //
      const uniqueGrains = Array.from(new Set(carotteData.map(d => d.Grain_size && d.Grain_size.trim()).filter(Boolean)));
      const uniqueEnvs = Array.from(new Set(carotteData.map(d => d.Environment && d.Environment.trim()).filter(Boolean)));

      console.log("uniqueGrains", uniqueGrains);
      console.log("uniqueEnvs", uniqueEnvs);

      // Groupes de granulométrie //
      const grainGroups = [
        { label: "Gravel", match: g => g && g.toLowerCase().includes("gravel"), pattern: "url(#gravel-pattern)" },
        { label: "Sand & Silt", match: g => g && (g.toLowerCase().includes("sandy silt") || (g.toLowerCase().includes("sand") && g.toLowerCase().includes("silt"))), pattern: "url(#sandysilt-pattern)" },
        { label: "Sand", match: g => g && g.toLowerCase().includes("sand") && !g.toLowerCase().includes("silt"), pattern: "url(#sand-pattern)" },
        { label: "Silt", match: g => g && g.toLowerCase().includes("silt") && !g.toLowerCase().includes("sand"), pattern: "url(#silt-pattern)" }
      ];

      // Groupes d'environnement //
      const envGroups = [
        { label: "Freshwater", match: e => e && e.toLowerCase().includes("freshwater"), color: "#52b432" }, 
        { label: "Terrestrial", match: e => e && e.toLowerCase().includes("terrestrial"), color: "#8B5A2B" },
        { label: "Brackish", match: e => e && e.toLowerCase().includes("brackish"), color: "#ba9cd4" },
        { label: "Marine", match: e => e && (e.toLowerCase().includes("marin") || e.toLowerCase().includes("marine")), color: "#83d0e9" }
      ];

      // Déterminer quels groupes sont présents dans la carotte affichée //
      const presentGrainGroups = grainGroups.filter(group =>
        uniqueGrains.some(grain => group.match(grain))
      );
      const presentEnvGroups = envGroups.filter(group =>
        uniqueEnvs.some(env => group.match(env))
      );

      

      // Créer la légende seulement s'il y a des éléments à afficher //
      if (uniqueGrains.length > 0 || uniqueEnvs.length > 0) {
        const maxLegendHeight = 180;
        const maxLines = Math.max(presentGrainGroups.length, presentEnvGroups.length);
        let boxHeight = 20, boxWidth = 26, spacing = 24, textYOffset = 15;
        if (28 + maxLines * spacing > maxLegendHeight) {
          spacing = Math.floor((maxLegendHeight - 28) / maxLines);
          boxHeight = Math.max(12, spacing - 6);
          boxWidth = Math.max(16, boxHeight + 6);
          textYOffset = Math.floor(boxHeight * 0.7);
        }
        const legendSvg = subContainer3.append("svg")
          .attr("width", 350)
          .attr("height", 28 + maxLines * spacing + 40);

        const legendDefs = legendSvg.append("defs");

        // Motif pour "Sand" //
        legendDefs.append("pattern")
          .attr("id", "sand-pattern")
          .attr("patternUnits", "userSpaceOnUse")
          .attr("width", 6)
          .attr("height", 6)
          .append("circle")
          .attr("cx", 3)
          .attr("cy", 3)
          .attr("r", 1)
          .attr("fill", "black");

        // Motif pour "Silt" //
        const siltPattern = legendDefs.append("pattern")
          .attr("id", "silt-pattern")
          .attr("patternUnits", "userSpaceOnUse")
          .attr("width", 6)
          .attr("height", 6);

        siltPattern.append("line")
          .attr("x1", 0).attr("y1", 1)
          .attr("x2", 3).attr("y2", 1)
          .attr("stroke", "black").attr("stroke-width", 1);

        siltPattern.append("line")
          .attr("x1", 3).attr("y1", 4)
          .attr("x2", 6).attr("y2", 4)
          .attr("stroke", "black").attr("stroke-width", 1);

        // Motif pour "Sandy Silt" //
        const sandySiltPattern = legendDefs.append("pattern")
          .attr("id", "sandysilt-pattern")
          .attr("patternUnits", "userSpaceOnUse")
          .attr("width", 8)
          .attr("height", 8);

        sandySiltPattern.append("line")
          .attr("x1", 0).attr("y1", 4)
          .attr("x2", 2).attr("y2", 4)
          .attr("stroke", "black").attr("stroke-width", 1.2);

        sandySiltPattern.append("circle")
          .attr("cx", 4).attr("cy", 4)
          .attr("r", 1)
          .attr("fill", "black");

        sandySiltPattern.append("line")
          .attr("x1", 6).attr("y1", 4)
          .attr("x2", 8).attr("y2", 4)
          .attr("stroke", "black").attr("stroke-width", 1.2);

        // Motif pour "Gravel" //
        legendDefs.append("pattern")
          .attr("id", "gravel-pattern")
          .attr("patternUnits", "userSpaceOnUse")
          .attr("width", 10)
          .attr("height", 10)
          .append("circle")
          .attr("cx", 5)
          .attr("cy", 5)
          .attr("r", 2)
          .attr("fill", "black");


        // Titres de légende //
        if (presentGrainGroups.length > 0) {
          legendSvg.append("text")
            .attr("x", 35)
            .attr("y", 18)
            .attr("class", "legend-title-dc3")
            .attr("text-anchor", "start")
            .text("Granulométrie");
        }
        if (presentEnvGroups.length > 0) {
          legendSvg.append("text")
            .attr("x", 195)
            .attr("y", 18)
            .attr("class", "legend-title-dc3")
            .attr("text-anchor", "start")
            .text("Environnement");
        }

        // Symboles granulométrie //
        const grainCols = presentGrainGroups.length > 2 ? 2 : 1;
        const grainRows = Math.ceil(presentGrainGroups.length / grainCols);
        const grainColSpacing = 60; 
        const grainLeftOffset = -15; 
        presentGrainGroups.forEach((group, i) => {
          const col = grainCols === 2 ? i % 2 : 0;
          const row = grainCols === 2 ? Math.floor(i / 2) : i;
          legendSvg.append("rect")
            .attr("x", 20 + grainLeftOffset + col * (boxWidth + grainColSpacing))
            .attr("y", 28 + row * spacing)
            .attr("width", boxWidth)
            .attr("height", boxHeight)
            .attr("fill", group.pattern)
            .attr("stroke", "#333");

          legendSvg.append("text")
            .attr("x", 20 + grainLeftOffset + col * (boxWidth + grainColSpacing) + boxWidth + 8)
            .attr("y", 28 + row * spacing + textYOffset)
            .attr("class", "legend-info-dc3")
            .attr("alignment-baseline", "middle")
            .attr("text-anchor", "start")
            .text(group.label);
        });

        // Symboles environnement //
        const envCols = presentEnvGroups.length > 2 ? 2 : 1;
        const envRows = Math.ceil(presentEnvGroups.length / envCols);
        const envColSpacing = 60;
        presentEnvGroups.forEach((group, i) => {
          const col = envCols === 2 ? i % 2 : 0;
          const row = envCols === 2 ? Math.floor(i / 2) : i;
          legendSvg.append("rect")
            .attr("x", 180 + col * (boxWidth + envColSpacing))
            .attr("y", 28 + row * spacing)
            .attr("width", boxWidth)
            .attr("height", boxHeight)
            .attr("fill", group.color)
            .attr("stroke", "#333");

          legendSvg.append("text")
            .attr("x", 180 + col * (boxWidth + envColSpacing) + boxWidth + 8)
            .attr("y", 28 + row * spacing + textYOffset)
            .attr("class", "legend-info-dc3")
            .attr("alignment-baseline", "middle")
            .attr("text-anchor", "start")
            .text(group.label);
        });

        
        const legendBottomY = 28 + Math.max(
          Math.ceil(presentGrainGroups.length / (presentGrainGroups.length > 2 ? 2 : 1)),
          Math.ceil(presentEnvGroups.length / (presentEnvGroups.length > 2 ? 2 : 1))
        ) * spacing + 18;

        // Ajout du symbole de datation //
        legendSvg.append("circle")
          .attr("cx", 35)
          .attr("cy", legendBottomY)
          .attr("r", 5)
          .attr("fill", "#fffb00")
          .attr("stroke", "#333");

        legendSvg.append("text")
          .attr("x", 48)
          .attr("y", legendBottomY + 4)
          .attr("class", "legend-info-dc3")
          .attr("alignment-baseline", "middle")
          .attr("text-anchor", "start")
          .style("font-size", "8px")
          .text("Datations");

        legendSvg.append("text")
          .attr("x", 20)
          .attr("y", legendBottomY - 12)
          .attr("class", "legend-title-dc3")
          .attr("text-anchor", "start")
          .text("Datation");
        
      }
      });


    }).catch(error => {
      console.error("Erreur chargement Infos_carottes :", error);
    });

  }).catch(error => {
    console.error("Erreur chargement carottes :", error);
  });
}

// Fonction pour couper le texte en lignes si nécessaire //
function wrapText(text, width) {
  const words = text.split(/\s+/);
  let lines = [];
  let line = [];
  let lineLength = 0;
  words.forEach(word => {
    if ((lineLength + word.length) * 7 > width && line.length > 0) {
      lines.push(line.join(" "));
      line = [word];
      lineLength = word.length;
    } else {
      line.push(word);
      lineLength += word.length;
    }
  });
  if (line.length) lines.push(line.join(" "));
  return lines;
}

