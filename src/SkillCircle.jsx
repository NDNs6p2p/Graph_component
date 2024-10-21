import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { data } from './const/data';

// Функция для подготовки данных по name и mainSkills и otherSkills:
const prepareData = () => {
  const skillToIndex = {};
  let skills = [];
  let competencies = [];

  data.forEach((competency) => {
    competencies.push({
      name: competency.name,
      itemStyle: { color: '#ADADAD', borderWidth: 0 },
    });
    competency.mainSkills.forEach((skill) => {
      if (!skillToIndex.hasOwnProperty(skill)) {
        skillToIndex[skill] = skills.length;
        skills.push({
          name: skill,
          itemStyle: { color: '#FF7A00' },
        });
      }
    });
    competency.otherSkills.forEach((skill) => {
      if (!skillToIndex.hasOwnProperty(skill)) {
        skillToIndex[skill] = skills.length;
        skills.push({
          name: skill,
          itemStyle: { color: '#FF7A00' },
        });
      }
    });
  });

  return { competencies, skills, skillToIndex };
};

//  Функция для создания точек графа
const createPoints = (competencies, skills) => {
  const competencyPoints = competencies.map((competency, index) => ({
    name: competency.name,
    //в макете 256, так выглядит лучше
    x:
      Math.cos((2 * Math.PI * index) / competencies.length - Math.PI / 2) * 200,
    y:
      Math.sin((2 * Math.PI * index) / competencies.length - Math.PI / 2) * 200,
    symbolSize: 23.7,
    itemStyle: competency.itemStyle,
    category: 'competency',
  }));

  const skillPoints = skills.map((skill, index) => ({
    name: skill.name,
    //в макете 533, так выглядит лучше
    x: Math.cos((2 * Math.PI * index) / skills.length - Math.PI / 2) * 350,
    y: Math.sin((2 * Math.PI * index) / skills.length - Math.PI / 2) * 350,
    symbolSize: 27.53,
    itemStyle: skill.itemStyle,
    category: 'skill',
  }));

  return { competencyPoints, skillPoints };
};

//  функция для создания связей между графами
const createEdges = (competencies, skills, skillToIndex) => {
  const lines = [];
  data.forEach((competency, competencyIndex) => {
    competency.mainSkills.forEach((skill) => {
      lines.push({
        source: competencyIndex,
        target: skillToIndex[skill] + competencies.length,
        lineStyle: {
          color: '#FF7A00',
          width: 2,
          curveness: 0.6,
        },
      });
    });
    competency.otherSkills.forEach((skill) => {
      lines.push({
        source: competencyIndex,
        target: skillToIndex[skill] + competencies.length,
        lineStyle: {
          color: '#8F59B9',
          width: 2,
          curveness: 0.6,
        },
      });
    });
  });

  return lines;
};

//  Функция для создания круговых линий (для свойства edges)
const createCircularLines = (competencies, skills) => {
  const circularLines = [];

  competencies.forEach((_, index) => {
    const nextIndex = (index + 1) % competencies.length;
    circularLines.push({
      source: index,
      target: nextIndex,
      lineStyle: {
        color: '#ADADAD',
        width: 2.35,
        curveness: 0.1,
      },
    });
  });

  skills.forEach((_, index) => {
    const nextIndex = (index + 1) % skills.length;
    circularLines.push({
      source: competencies.length + index,
      target: competencies.length + nextIndex,
      lineStyle: {
        color: '#ADADAD',
        width: 2.35,
        curveness: 0.1,
      },
    });
  });

  return circularLines;
};

const CompetencyChart = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = echarts.init(chartRef.current);

    const { competencies, skills, skillToIndex } = prepareData();
    const { competencyPoints, skillPoints } = createPoints(
      competencies,
      skills
    );
    const edges = createEdges(competencies, skills, skillToIndex);
    const circularLines = createCircularLines(competencies, skills);

    const updateColors = (selectedName, category) => {
      competencies.forEach((competency) => {
        const relatedSkills =
          data
            .find((comp) => comp.name === competency.name)
            ?.mainSkills.includes(selectedName) ||
          data
            .find((comp) => comp.name === competency.name)
            ?.otherSkills.includes(selectedName);

        competency.itemStyle.color =
          relatedSkills && category === 'skill' ? '#00A372' : '#ADADAD';
        competency.itemStyle.borderWidth =
          competency.name === selectedName && category === 'competency'
            ? 10
            : 0;
        competency.itemStyle.borderColor = '#00A372';
      });

      skills.forEach((skill) => {
        skill.itemStyle.color =
          skill.name === selectedName && category === 'skill'
            ? '#FF7A00'
            : '#FFD4AD';
      });
    };

    const resetSkillBackgrounds = () => {
      skills.forEach((skill) => {
        skill.itemStyle.color = '#FFD4AD';
      });
    };

    chart.setOption({
      animationDurationUpdate: 1500,
      series: [
        {
          type: 'graph',
          data: [...competencyPoints, ...skillPoints],
          edges: circularLines,
          label: {
            show: true,
            position: 'right',
            fontSize: 14,
            color: '#000',
            fontSize: 10,
            fontWeight: 700,
          },
          roam: false,
          lineStyle: {
            opacity: 0.8,
          },
          categories: [
            { name: 'competency', itemStyle: { color: '#ADADAD' } },
            { name: 'skill', itemStyle: { color: '#FF7A00' } },
          ],
        },
      ],
    });

    chart.on('click', function (params) {
      if (params.data) {
        resetSkillBackgrounds();
        updateColors(params.data.name, params.data.category);

        const selectedCompetencyIndex = competencies.findIndex(
          (competency) => competency.name === params.data.name
        );
        const selectedSkill = params.data.name;

        const relatedEdges = [];

        if (params.data.category === 'competency') {
          const selectedCompetency = data[selectedCompetencyIndex];
          selectedCompetency.mainSkills.forEach((skill) => {
            const skillIndex = skillToIndex[skill];
            skillPoints[skillIndex].itemStyle.color = '#FF7A00';
          });
          selectedCompetency.otherSkills.forEach((skill) => {
            const skillIndex = skillToIndex[skill];
            skillPoints[skillIndex].itemStyle.color = '#FF7A00';
          });

          data[selectedCompetencyIndex].mainSkills.forEach((skill) => {
            relatedEdges.push({
              source: selectedCompetencyIndex,
              target: skillToIndex[skill] + competencies.length,
              lineStyle: {
                color: '#FF7A00',
                width: 2,
                curveness: 0.3,
              },
            });
          });
          data[selectedCompetencyIndex].otherSkills.forEach((skill) => {
            relatedEdges.push({
              source: selectedCompetencyIndex,
              target: skillToIndex[skill] + competencies.length,
              lineStyle: {
                color: '#8F59B9',
                width: 1,
                curveness: 0.3,
              },
            });
          });
        } else if (params.data.category === 'skill') {
          data.forEach((competency, competencyIndex) => {
            if (competency.mainSkills.includes(selectedSkill)) {
              relatedEdges.push({
                source: competencyIndex,
                target: skillToIndex[selectedSkill] + competencies.length,
                lineStyle: {
                  color: '#FF7A00',
                  width: 2,
                  curveness: 0.3,
                },
              });
            }
            if (competency.otherSkills.includes(selectedSkill)) {
              relatedEdges.push({
                source: competencyIndex,
                target: skillToIndex[selectedSkill] + competencies.length,
                lineStyle: {
                  color: '#8F59B9',
                  width: 1,
                  curveness: 0.3,
                },
              });
            }
          });
        }

        chart.setOption({
          series: [
            {
              type: 'graph',
              layout: 'none',
              data: [...competencyPoints, ...skillPoints],
              edges: [...relatedEdges, ...circularLines],
            },
          ],
        });
      }
    });

    return () => {
      chart.dispose();
    };
  }, []);

  return <div ref={chartRef} style={{ width: '100%', height: '100vh' }} />;
};

export default CompetencyChart;
