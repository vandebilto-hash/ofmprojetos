import { NextResponse } from "next/server";

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project/2003/mspdi" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <UID>1</UID>
  <Name>Template Projete-se</Name>
  <Title>Template de Importacao - Projete-se</Title>
  <CreationDate>2026-06-16T10:00:00</CreationDate>
  <LastSaved>2026-06-16T10:00:00</LastSaved>
  <ScheduleFromStart>1</ScheduleFromStart>
  <StartDate>2026-07-01T08:00:00</StartDate>
  <FinishDate>2026-09-10T17:00:00</FinishDate>
  <DaysPerMonth>22</DaysPerMonth>
  <DefaultStartTime>08:00:00</DefaultStartTime>
  <DefaultEndTime>17:00:00</DefaultEndTime>
  <MinutesPerDay>480</MinutesPerDay>
  <MinutesPerWeek>2400</MinutesPerWeek>
  <CurrencySymbol>R$</CurrencySymbol>
  <Calendars>
    <Calendar>
      <UID>1</UID>
      <Name>Padrao</Name>
      <IsBaseCalendar>0</IsBaseCalendar>
      <BaseCalendarUID>-1</BaseCalendarUID>
      <WeekDays>
        <WeekDay><DayType>1</DayType><DayWorking>0</DayWorking></WeekDay>
        <WeekDay><DayType>2</DayType><DayWorking>1</DayWorking><WorkingTimes><WorkingTime><FromTime>08:00:00</FromTime><ToTime>12:00:00</ToTime></WorkingTime><WorkingTime><FromTime>13:00:00</FromTime><ToTime>17:00:00</ToTime></WorkingTime></WorkingTimes></WeekDay>
        <WeekDay><DayType>3</DayType><DayWorking>1</DayWorking><WorkingTimes><WorkingTime><FromTime>08:00:00</FromTime><ToTime>12:00:00</ToTime></WorkingTime><WorkingTime><FromTime>13:00:00</FromTime><ToTime>17:00:00</ToTime></WorkingTime></WorkingTimes></WeekDay>
        <WeekDay><DayType>4</DayType><DayWorking>1</DayWorking><WorkingTimes><WorkingTime><FromTime>08:00:00</FromTime><ToTime>12:00:00</ToTime></WorkingTime><WorkingTime><FromTime>13:00:00</FromTime><ToTime>17:00:00</ToTime></WorkingTime></WorkingTimes></WeekDay>
        <WeekDay><DayType>5</DayType><DayWorking>1</DayWorking><WorkingTimes><WorkingTime><FromTime>08:00:00</FromTime><ToTime>12:00:00</ToTime></WorkingTime><WorkingTime><FromTime>13:00:00</FromTime><ToTime>17:00:00</ToTime></WorkingTime></WorkingTimes></WeekDay>
        <WeekDay><DayType>6</DayType><DayWorking>1</DayWorking><WorkingTimes><WorkingTime><FromTime>08:00:00</FromTime><ToTime>12:00:00</ToTime></WorkingTime></WorkingTimes></WeekDay>
        <WeekDay><DayType>7</DayType><DayWorking>0</DayWorking></WeekDay>
      </WeekDays>
    </Calendar>
  </Calendars>
  <Tasks>
    ${generateTasks()}
  </Tasks>
  <Resources>
    ${generateResources()}
  </Resources>
  <Assignments />
</Project>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template-projete-se.xml"'
    }
  });
}

function generateTasks() {
  const tasks = [
    { uid: 1, id: 1, name: "Fase de Planejamento", level: 1, wbs: "1", start: "2026-07-01T08:00:00", finish: "2026-07-15T17:00:00", dur: "PT320H0M0S", pred: "" },
    { uid: 2, id: 2, name: "Definicao de Escopo", level: 2, wbs: "1.1", start: "2026-07-01T08:00:00", finish: "2026-07-05T17:00:00", dur: "PT40H0M0S", pred: "" },
    { uid: 3, id: 3, name: "Levantamento de Requisitos", level: 3, wbs: "1.1.1", start: "2026-07-01T08:00:00", finish: "2026-07-03T17:00:00", dur: "PT16H0M0S", pred: "" },
    { uid: 4, id: 4, name: "Documentacao de Escopo", level: 3, wbs: "1.1.2", start: "2026-07-03T08:00:00", finish: "2026-07-05T17:00:00", dur: "PT16H0M0S", pred: "3FS" },
    { uid: 5, id: 5, name: "Planejamento de Recursos", level: 2, wbs: "1.2", start: "2026-07-05T08:00:00", finish: "2026-07-10T17:00:00", dur: "PT40H0M0S", pred: "4FS" },
    { uid: 6, id: 6, name: "Alocacao de Equipe", level: 3, wbs: "1.2.1", start: "2026-07-05T08:00:00", finish: "2026-07-08T17:00:00", dur: "PT24H0M0S", pred: "" },
    { uid: 7, id: 7, name: "Aquisicao de Ferramentas", level: 3, wbs: "1.2.2", start: "2026-07-08T08:00:00", finish: "2026-07-10T17:00:00", dur: "PT16H0M0S", pred: "6FS" },
    { uid: 8, id: 8, name: "Aprovacao do Planejamento", level: 2, wbs: "1.3", start: "2026-07-10T08:00:00", finish: "2026-07-15T17:00:00", dur: "PT32H0M0S", pred: "7FS" },
    { uid: 9, id: 9, name: "Fase de Desenvolvimento", level: 1, wbs: "2", start: "2026-07-15T08:00:00", finish: "2026-08-30T17:00:00", dur: "PT400H0M0S", pred: "8FS" },
    { uid: 10, id: 10, name: "Modulo Backend", level: 2, wbs: "2.1", start: "2026-07-15T08:00:00", finish: "2026-08-10T17:00:00", dur: "PT160H0M0S", pred: "" },
    { uid: 11, id: 11, name: "API REST", level: 3, wbs: "2.1.1", start: "2026-07-15T08:00:00", finish: "2026-07-25T17:00:00", dur: "PT80H0M0S", pred: "" },
    { uid: 12, id: 12, name: "Banco de Dados", level: 3, wbs: "2.1.2", start: "2026-07-25T08:00:00", finish: "2026-08-05T17:00:00", dur: "PT80H0M0S", pred: "11FS" },
    { uid: 13, id: 13, name: "Integracao", level: 3, wbs: "2.1.3", start: "2026-08-05T08:00:00", finish: "2026-08-10T17:00:00", dur: "PT40H0M0S", pred: "12FS" },
    { uid: 14, id: 14, name: "Modulo Frontend", level: 2, wbs: "2.2", start: "2026-07-20T08:00:00", finish: "2026-08-20T17:00:00", dur: "PT200H0M0S", pred: "" },
    { uid: 15, id: 15, name: "Design de Interface", level: 3, wbs: "2.2.1", start: "2026-07-20T08:00:00", finish: "2026-07-30T17:00:00", dur: "PT80H0M0S", pred: "" },
    { uid: 16, id: 16, name: "Implementacao de Componentes", level: 3, wbs: "2.2.2", start: "2026-07-30T08:00:00", finish: "2026-08-15T17:00:00", dur: "PT120H0M0S", pred: "15FS" },
    { uid: 17, id: 17, name: "Testes de Interface", level: 3, wbs: "2.2.3", start: "2026-08-15T08:00:00", finish: "2026-08-20T17:00:00", dur: "PT40H0M0S", pred: "16FS" },
    { uid: 18, id: 18, name: "Testes Integrados", level: 2, wbs: "2.3", start: "2026-08-20T08:00:00", finish: "2026-08-30T17:00:00", dur: "PT80H0M0S", pred: "13FS;17FS" },
    { uid: 19, id: 19, name: "Fase de Entrega", level: 1, wbs: "3", start: "2026-08-30T08:00:00", finish: "2026-09-10T17:00:00", dur: "PT80H0M0S", pred: "18FS" },
    { uid: 20, id: 20, name: "Deploy em Producao", level: 2, wbs: "3.1", start: "2026-08-30T08:00:00", finish: "2026-09-05T17:00:00", dur: "PT40H0M0S", pred: "" },
    { uid: 21, id: 21, name: "Documentacao Final", level: 2, wbs: "3.2", start: "2026-09-01T08:00:00", finish: "2026-09-08T17:00:00", dur: "PT48H0M0S", pred: "" },
    { uid: 22, id: 22, name: "Treinamento do Cliente", level: 2, wbs: "3.3", start: "2026-09-05T08:00:00", finish: "2026-09-10T17:00:00", dur: "PT40H0M0S", pred: "20FS;21FS" },
  ];

  return tasks.map(t => {
    const predXml = t.pred ? `
        <PredecessorLinks>
          ${t.pred.split(";").map(p => {
            const uid = parseInt(p);
            return `<PredecessorLink><PredecessorUID>${uid}</PredecessorUID><Type>1</Type><Lag>0</Lag><CrossProject>0</CrossProject><ExternalTask>0</ExternalTask></PredecessorLink>`;
          }).join("\n          ")}
        </PredecessorLinks>` : "";

    return `      <Task>
        <UID>${t.uid}</UID>
        <ID>${t.id}</ID>
        <Name>${t.name}</Name>
        <Type>1</Type>
        <IsNull>0</IsNull>
        <CreateDate>2026-06-16T10:00:00</CreateDate>
        <Start>${t.start}</Start>
        <Finish>${t.finish}</Finish>
        <Duration>${t.dur}</Duration>
        <DurationFormat>7</DurationFormat>
        <OutlineLevel>${t.level}</OutlineLevel>
        <OutlineNumber>${t.wbs}</OutlineNumber>
        <Priority>500</Priority>
        <PercentComplete>0</PercentComplete>
        <PercentWorkComplete>0</PercentWorkComplete>
        <FixedCost>0</FixedCost>
        <FixedCostAccrual>2</FixedCostAccrual>
        <Work>PT0H0M0S</Work>
        <ConstraintType>0</ConstraintType>
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
        <RemainingDuration>${t.dur}</RemainingDuration>
        <Notes>Template - edite com observacoes da tarefa</Notes>
        <Stop>1984-01-01T00:00:00</Stop>
        <Resume>1984-01-01T00:00:00</Resume>
        <RecalcFlags>0</RecalcFlags>${predXml}
        <Hyperlink />
        <HyperlinkAddress />
        <HyperlinkSubAddress />
        <IsRecurring>0</IsRecurring>
        <IgnoreWarnings>0</IgnoreWarnings>
        <IsMarked>0</IsMarked>
      </Task>`;
  }).join("\n");
}

function generateResources() {
  const resources = [
    { uid: 1, name: "Joao Silva" },
    { uid: 2, name: "Maria Santos" },
    { uid: 3, name: "Carlos Oliveira" },
    { uid: 4, name: "Ana Rodrigues" },
    { uid: 5, name: "Pedro Costa" },
  ];

  return resources.map(r => `      <Resource>
        <UID>${r.uid}</UID>
        <ID>${r.uid}</ID>
        <Type>1</Type>
        <IsNull>0</IsNull>
        <CreateDate>2026-06-16T10:00:00</CreateDate>
        <Name>${r.name}</Name>
        <Cost>0</Cost>
        <OvertimeCost>0</OvertimeCost>
        <RegularCost>0</RegularCost>
        <ActualCost>0</ActualCost>
        <ActualOvertimeCost>0</ActualOvertimeCost>
        <ActualWork>PT0H0M0S</ActualWork>
        <ActualOvertimeWork>PT0H0M0S</ActualOvertimeWork>
        <BaselineCost>0</BaselineCost>
        <BaselineWork>PT0H0M0S</BaselineWork>
        <PeakUnits>0</PeakUnits>
        <TotalFixedCost>0</TotalFixedCost>
        <MaxUnits>1</MaxUnits>
      </Resource>`).join("\n");
}
