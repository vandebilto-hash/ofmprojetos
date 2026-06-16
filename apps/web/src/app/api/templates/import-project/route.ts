import { NextResponse } from "next/server";

function generateMspdiXml(): string {
  const tasks = [
    { uid: 1, name: "Fase de Planejamento", outlineLevel: 0, outlineNumber: "1", start: "2026-07-01T08:00:00", finish: "2026-07-15T17:00:00", duration: "PT320H0M0S", percentComplete: 0, priority: 500, predecesors: "" },
    { uid: 2, name: "Definicao de Escopo", outlineLevel: 1, outlineNumber: "1.1", start: "2026-07-01T08:00:00", finish: "2026-07-05T17:00:00", duration: "PT40H0M0S", percentComplete: 0, priority: 500, predecesors: "" },
    { uid: 3, name: "Levantamento de Requisitos", outlineLevel: 2, outlineNumber: "1.1.1", start: "2026-07-01T08:00:00", finish: "2026-07-03T17:00:00", duration: "PT16H0M0S", percentComplete: 0, priority: 500, predecesors: "" },
    { uid: 4, name: "Documentacao de Escopo", outlineLevel: 2, outlineNumber: "1.1.2", start: "2026-07-03T08:00:00", finish: "2026-07-05T17:00:00", duration: "PT16H0M0S", percentComplete: 0, priority: 500, predecesors: "3FS" },
    { uid: 5, name: "Planejamento de Recursos", outlineLevel: 1, outlineNumber: "1.2", start: "2026-07-05T08:00:00", finish: "2026-07-10T17:00:00", duration: "PT40H0M0S", percentComplete: 0, priority: 500, predecesors: "4FS" },
    { uid: 6, name: "Alocacao de Equipe", outlineLevel: 2, outlineNumber: "1.2.1", start: "2026-07-05T08:00:00", finish: "2026-07-08T17:00:00", duration: "PT24H0M0S", percentComplete: 0, priority: 500, predecesors: "" },
    { uid: 7, name: "Aquisicao de Ferramentas", outlineLevel: 2, outlineNumber: "1.2.2", start: "2026-07-08T08:00:00", finish: "2026-07-10T17:00:00", duration: "PT16H0M0S", percentComplete: 0, priority: 500, predecesors: "6FS" },
    { uid: 8, name: "Aprovacao do Planejamento", outlineLevel: 1, outlineNumber: "1.3", start: "2026-07-10T08:00:00", finish: "2026-07-15T17:00:00", duration: "PT32H0M0S", percentComplete: 0, priority: 500, predecesors: "7FS" },
    { uid: 9, name: "Fase de Desenvolvimento", outlineLevel: 0, outlineNumber: "2", start: "2026-07-15T08:00:00", finish: "2026-08-30T17:00:00", duration: "PT400H0M0S", percentComplete: 0, priority: 500, predecesors: "8FS" },
    { uid: 10, name: "Modulo Backend", outlineLevel: 1, outlineNumber: "2.1", start: "2026-07-15T08:00:00", finish: "2026-08-10T17:00:00", duration: "PT160H0M0S", percentComplete: 0, priority: 500, predecesors: "" },
    { uid: 11, name: "API REST", outlineLevel: 2, outlineNumber: "2.1.1", start: "2026-07-15T08:00:00", finish: "2026-07-25T17:00:00", duration: "PT80H0M0S", percentComplete: 0, priority: 500, predecesors: "" },
    { uid: 12, name: "Banco de Dados", outlineLevel: 2, outlineNumber: "2.1.2", start: "2026-07-25T08:00:00", finish: "2026-08-05T17:00:00", duration: "PT80H0M0S", percentComplete: 0, priority: 500, predecesors: "11FS" },
    { uid: 13, name: "Integracao", outlineLevel: 2, outlineNumber: "2.1.3", start: "2026-08-05T08:00:00", finish: "2026-08-10T17:00:00", duration: "PT40H0M0S", percentComplete: 0, priority: 500, predecesors: "12FS" },
    { uid: 14, name: "Modulo Frontend", outlineLevel: 1, outlineNumber: "2.2", start: "2026-07-20T08:00:00", finish: "2026-08-20T17:00:00", duration: "PT200H0M0S", percentComplete: 0, priority: 500, predecesors: "" },
    { uid: 15, name: "Design de Interface", outlineLevel: 2, outlineNumber: "2.2.1", start: "2026-07-20T08:00:00", finish: "2026-07-30T17:00:00", duration: "PT80H0M0S", percentComplete: 0, priority: 500, predecesors: "" },
    { uid: 16, name: "Implementacao de Componentes", outlineLevel: 2, outlineNumber: "2.2.2", start: "2026-07-30T08:00:00", finish: "2026-08-15T17:00:00", duration: "PT120H0M0S", percentComplete: 0, priority: 500, predecesors: "15FS" },
    { uid: 17, name: "Testes de Interface", outlineLevel: 2, outlineNumber: "2.2.3", start: "2026-08-15T08:00:00", finish: "2026-08-20T17:00:00", duration: "PT40H0M0S", percentComplete: 0, priority: 500, predecesors: "16FS" },
    { uid: 18, name: "Testes Integrados", outlineLevel: 1, outlineNumber: "2.3", start: "2026-08-20T08:00:00", finish: "2026-08-30T17:00:00", duration: "PT80H0M0S", percentComplete: 0, priority: 500, predecesors: "13FS;17FS" },
    { uid: 19, name: "Fase de Entrega", outlineLevel: 0, outlineNumber: "3", start: "2026-08-30T08:00:00", finish: "2026-09-10T17:00:00", duration: "PT80H0M0S", percentComplete: 0, priority: 500, predecesors: "18FS" },
    { uid: 20, name: "Deploy em Producao", outlineLevel: 1, outlineNumber: "3.1", start: "2026-08-30T08:00:00", finish: "2026-09-05T17:00:00", duration: "PT40H0M0S", percentComplete: 0, priority: 500, predecesors: "" },
    { uid: 21, name: "Documentacao Final", outlineLevel: 1, outlineNumber: "3.2", start: "2026-09-01T08:00:00", finish: "2026-09-08T17:00:00", duration: "PT48H0M0S", percentComplete: 0, priority: 500, predecesors: "" },
    { uid: 22, name: "Treinamento do Cliente", outlineLevel: 1, outlineNumber: "3.3", start: "2026-09-05T08:00:00", finish: "2026-09-10T17:00:00", duration: "PT40H0M0S", percentComplete: 0, priority: 500, predecesors: "20FS;21FS" },
  ];

  const resources = [
    { uid: 1, name: "Joao Silva", type: 1 },
    { uid: 2, name: "Maria Santos", type: 1 },
    { uid: 3, name: "Carlos Oliveira", type: 1 },
    { uid: 4, name: "Ana Rodrigues", type: 1 },
    { uid: 5, name: "Pedro Costa", type: 1 },
  ];

  const taskElements = tasks.map((t) => {
    const predecessorsXml = t.predecesors
      ? t.predecesors.split(";").map((p) => {
          const predecessorUid = parseInt(p);
          const typeMatch = p.match(/[A-Z]+$/);
          const lagMatch = p.match(/([+-]?\d+)D$/);
          return `        <PredecessorLink>
          <PredecessorUID>${predecessorUid}</PredecessorUID>
          <Type>1</Type>
          <Lag>0</Lag>
          <CrossProject>0</CrossProject>
          <ExternalTask>0</ExternalTask>
        </PredecessorLink>`;
        }).join("\n")
      : "";

    return `      <Task>
        <UID>${t.uid}</UID>
        <ID>${t.uid}</ID>
        <Name>${t.name}</Name>
        <Type>1</Type>
        <IsNull>0</IsNull>
        <CreateDate>2026-06-15T10:00:00</CreateDate>
        <Start>${t.start}</Start>
        <Finish>${t.finish}</Finish>
        <Duration>${t.duration}</Duration>
        <DurationFormat>7</DurationFormat>
        <OutlineLevel>${t.outlineLevel + 1}</OutlineLevel>
        <OutlineNumber>${t.outlineNumber}</OutlineNumber>
        <Priority>${t.priority}</Priority>
        <PercentComplete>${t.percentComplete}</PercentComplete>
        <PercentWorkComplete>${t.percentComplete}</PercentWorkComplete>
        <FixedCost>0</FixedCost>
        <FixedCostAccrual>2</FixedCostAccrual>
        <Work>PT0H0M0S</Work>
        <ConstraintType>0</ConstraintType>
        <ConstraintDate>1984-01-01T00:00:00</ConstraintDate>
        <CalendarUID>-1</CalendarUID>
        <Fixed>0</Fixed>
        <LevelingDelay>0</LevelingDelay>
        <LevelingDelayFormat>7</LevelingDelayFormat>
        <IgnoreResourceCalendar>0</IgnoreResourceCalendar>
        <HideBar>0</HideBar>
        <Rollup>0</Rollup>
        <BCWS>0</BCWS>
        <BCWP>0</BCWP>
        <ACWP>0</ACWP>
        <IsCritical>0</IsCritical>
        <IsEffortDriven>0</IsEffortDriven>
        <IsLocked>0</IsLocked>
        <IsExternal>0</IsExternal>
        <IsManual>0</IsManual>
        <SubprojectName />
        <SubprojectReadOnly>0</SubprojectReadOnly>
        <ExternalTaskProject />
        <EarlyStart>${t.start}</EarlyStart>
        <EarlyFinish>${t.finish}</EarlyFinish>
        <LateStart>${t.start}</LateStart>
        <LateFinish>${t.finish}</LateFinish>
        <StartVariance>0</StartVariance>
        <FinishVariance>0</FinishVariance>
        <FreeSlack>0</FreeSlack>
        <TotalSlack>0</TotalSlack>
        <Cost>0</Cost>
        <OvertimeCost>0</OvertimeCost>
        <OvertimeWork>PT0H0M0S</OvertimeWork>
        <ActualCost>0</ActualCost>
        <ActualWork>PT0H0M0S</ActualWork>
        <ActualDuration>PT0H0M0S</ActualDuration>
        <ActualStart>1984-01-01T00:00:00</ActualStart>
        <ActualFinish>1984-01-01T00:00:00</ActualFinish>
        <RegularWork>PT0H0M0S</RegularWork>
        <RemainingCost>0</RemainingCost>
        <RemainingWork>PT0H0M0S</RemainingWork>
        <RemainingDuration>${t.duration}</RemainingDuration>
        <Notes>Template de importacao - edite este campo com observacoes da tarefa.</Notes>
        <Stop>1984-01-01T00:00:00</Stop>
        <Resume>1984-01-01T00:00:00</Resume>
        <RecalcFlags>0</RecalcFlags>
${predecessorsXml ? `        <PredecessorLinks>\n${predecessorsXml}\n        </PredecessorLinks>` : ""}
        <Hyperlink />
        <HyperlinkAddress />
        <HyperlinkSubAddress />
        <IsRecurring>0</IsRecurring>
        <IgnoreWarnings>0</IgnoreWarnings>
        <IsMarked>0</IsMarked>
      </Task>`;
  }).join("\n");

  const resourceElements = resources.map((r) => `      <Resource>
        <UID>${r.uid}</UID>
        <ID>${r.uid}</ID>
        <Type>${r.type}</Type>
        <IsNull>0</IsNull>
        <CreateDate>2026-06-15T10:00:00</CreateDate>
        <Name>${r.name}</Name>
        <UnicodeName>${r.name}</UnicodeName>
        <Initials />
        <Group />
        <Code />
        <OfficePhoneNumber />
        <EmailAddress />
        <WindowsEmailAddress />
        <CostRateTable>A</CostRateTable>
        <BookingType>0</BookingType>
        <IsTeamPoolResource>0</IsTeamPoolResource>
        <ShouldTeamPoolResource>0</ShouldTeamPoolResource>
        <CanLevel>1</CanLevel>
        <AccrueAt>2</AccrueAt>
        <WorkGroup>0</WorkGroup>
        <RDN />
        <Cost>0</Cost>
        <OvertimeCost>0</OvertimeCost>
        <OvertimeRate>0</OvertimeRate>
        <OvertimeRateFormat>5</OvertimeRateFormat>
        <RegularCost>0</RegularCost>
        <RegularRate>0</RegularRate>
        <RegularRateFormat>5</RegularRateFormat>
        <CostPerUse>0</CostPerUse>
        <ActualCost>0</ActualCost>
        <ActualOvertimeCost>0</ActualOvertimeCost>
        <ActualWork>PT0H0M0S</ActualWork>
        <ActualOvertimeWork>PT0H0M0S</ActualOvertimeWork>
        <BaselineCost>0</BaselineCost>
        <BaselineWork>PT0H0M0S</BaselineWork>
        <Overallocated>0</Overallocated>
        <PeakUnits>0</PeakUnits>
        <TotalFixedCost>0</TotalFixedCost>
        <StandardRateFormat>5</StandardRateFormat>
        <AssignmentUnits>100</AssignmentUnits>
        <MaxUnits>1</MaxUnits>
      </Resource>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project/2003/mspdi">
  <UID>1</UID>
  <Name>Template Projete-se - Edite com seu projeto</Name>
  <Title>Template de Importacao</Title>
  <Subject>Modelo de cronograma para importacao no Projete-se</Subject>
  <Author>Projete-se</Author>
  <CreationDate>2026-06-15T10:00:00</CreationDate>
  <LastSaved>2026-06-15T10:00:00</LastSaved>
  <Company>Projete-se</Company>
  <Manager />
  <CalendarStandard>0</CalendarStandard>
  <ScheduleFromStart>1</ScheduleFromStart>
  <StartDate>2026-07-01T08:00:00</StartDate>
  <FinishDate>2026-09-10T17:00:00</FinishDate>
  <FYStartDate>1</FYStartDate>
  <CurrencySymbol>R$</CurrencySymbol>
  <CurrencySymbolPosition>2</CurrencySymbolPosition>
  <DecimalSeparator>,</DecimalSeparator>
  <ThousandsSeparator>.</ThousandsSeparator>
  <DaysPerMonth>22</DaysPerMonth>
  <DefaultStartTime>08:00:00</DefaultStartTime>
  <DefaultEndTime>17:00:00</DefaultEndTime>
  <MinutesPerDay>480</MinutesPerDay>
  <MinutesPerWeek>2400</MinutesPerWeek>
  <DefaultTaskType>0</DefaultTaskType>
  <DefaultEffortDriven>0</DefaultEffortDriven>
  <Projects>
    <Project>
      <UID>1</UID>
      <Name>Template Projete-se - Edite com seu projeto</Name>
    </Project>
  </Projects>
  <Calendars>
    <Calendar>
      <UID>1</UID>
      <Name>Padrao</Name>
      <IsBaseCalendar>0</IsBaseCalendar>
      <BaseCalendarUID>-1</BaseCalendarUID>
      <WeekDays>
        <WeekDay>
          <DayType>1</DayType>
          <DayWorking>0</DayWorking>
        </WeekDay>
        <WeekDay>
          <DayType>2</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>3</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>4</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>5</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>6</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>7</DayType>
          <DayWorking>0</DayWorking>
        </WeekDay>
      </WeekDays>
    </Calendar>
  </Calendars>
  <Tasks>
${taskElements}
  </Tasks>
  <Resources>
${resourceElements}
  </Resources>
  <Assignments />
  <TimeScaleValues />
</Project>`;
}

export async function GET() {
  const xml = generateMspdiXml();

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template-projete-se.xml"'
    }
  });
}
