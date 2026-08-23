const semesters = {
  sem3: {
    label: "Sem 3",
    courses: [
      { code: "I2201", credits: 4 },
      { code: "I2202", credits: 4 },
      { code: "I2203", credits: 4 },
      { code: "I2204", credits: 5 },
      { code: "I2205", credits: 3 },
      { code: "M2250", credits: 3 },
      { code: "I2231", name: "I2231/Python", credits: 3 },
      { code: "S2250", credits: 4 }
    ]
  },

  sem4: {
    label: "Sem 4",
    courses: [
      { code: "I2206", credits: 5 },
      { code: "I211", credits: 5 },
      { code: "I2207", credits: 4 },
      { code: "I2208", credits: 4 },
      { code: "I2209", credits: 4 },
      { code: "I2210", credits: 5 },
      { code: "I2236", name: "I2236/Optional Course", credits: 3 }
    ]
  }
};

let selectedSemester = "sem3";
let selectedMarkMode = "partial";

const courseGrid = document.querySelector("#course-grid");
const form = document.querySelector("#marks-form");
const resultBody = document.querySelector("#result-body");
const averageValue = document.querySelector("#average-value");
const gpaValue = document.querySelector("#gpa-value");
const gpaNote = document.querySelector("#gpa-note");
const overallStatus = document.querySelector("#overall-status");
const resetButton = document.querySelector("#reset-button");
const semesterInputs = document.querySelectorAll('input[name="semester"]');
const markModeInputs = document.querySelectorAll('input[name="mark-mode"]');

function getCourses() {
  return semesters[selectedSemester].courses;
}

function getInputConfig() {
  if (selectedMarkMode === "partial") {
    return {
      mode: "partial",
      label: "Partial",
      resultLabel: "Partial only",
      max: 30,
      inputLabel: "Partial mark /30",
      placeholder: "0 - 30"
    };
  }

  if (selectedMarkMode === "final70") {
    return {
      mode: "final70",
      label: "Final exam",
      resultLabel: "Final exam only",
      max: 70,
      inputLabel: "Final exam /70",
      placeholder: "0 - 70"
    };
  }

  return {
    mode: "final100",
    label: "Course grade",
    resultLabel: "Course grade",
    max: 100,
    inputLabel: "Course grade /100",
    placeholder: "0 - 100"
  };
}

function buildInputs() {
  const config = getInputConfig();

  courseGrid.innerHTML = getCourses()
    .map(
      (course) => `
        <div class="course-field">
          <label for="${course.code}-mark">
            <span>${course.name || course.code}</span>
            <span class="credits">${course.credits} credits</span>
          </label>

          <div class="mark-inputs single">
            <label class="mark-input" for="${course.code}-mark">
              <span>${config.inputLabel}</span>

              <input
                id="${course.code}-mark"
                name="${course.code}-mark"
                type="number"
                min="0"
                max="${config.max}"
                step="1"
                inputmode="numeric"
                placeholder="${config.placeholder}"
                required
              >
            </label>
          </div>

          <span
            class="error"
            id="${course.code}-error"
            aria-live="polite"
          ></span>
        </div>
      `
    )
    .join("");
}

function validateMark(input, max) {
  const value = input.value.trim();
  const mark = Number(value);
  const isEmpty = value === "";

  const isInvalid =
    isEmpty ||
    Number.isNaN(mark) ||
    !Number.isInteger(mark) ||
    mark < 0 ||
    mark > max;

  input.setAttribute("aria-invalid", String(isInvalid));

  return {
    isInvalid,
    mark
  };
}

function readMarks() {
  let hasError = false;
  const config = getInputConfig();

  const marks = getCourses().map((course) => {
    const error = document.querySelector(`#${course.code}-error`);
    const input = document.querySelector(`#${course.code}-mark`);
    const result = validateMark(input, config.max);

    error.textContent = result.isInvalid
      ? `Enter a whole number from 0 to ${config.max}.`
      : "";

    if (result.isInvalid) {
      hasError = true;
    }

    return {
      ...course,
      mark: result.mark
    };
  });

  return hasError
    ? null
    : {
      mode: config.mode,
      max: config.max,
      resultLabel: config.resultLabel,
      marks
    };
}

function getCourseStatus(mark, average) {
  if (mark >= 50) {
    return "Pass";
  }

  if (average >= 55 && mark >= 40) {
    return "Compensation";
  }

  return "Fail";
}

function interpolate(value, minValue, maxValue, minGpa, maxGpa) {
  const ratio =
    (value - minValue) /
    (maxValue - minValue);

  return minGpa + ratio * (maxGpa - minGpa);
}

function calculateGpa(average) {
  if (average < 50) {
    return null;
  }

  if (average < 63) {
    return interpolate(
      average,
      50,
      63,
      2.20,
      3.02
    );
  }

  if (average < 72) {
    return interpolate(
      average,
      63,
      72,
      3.02,
      3.63
    );
  }

  if (average < 80) {
    return interpolate(
      average,
      72,
      80,
      3.63,
      4.00
    );
  }

  return 4.00;
}

function renderStandaloneResults(result) {
  const { marks, max, resultLabel } = result;
  const totalCredits = marks.reduce(
    (sum, course) => sum + course.credits,
    0
  );

  const weightedTotal = marks.reduce(
    (sum, course) =>
      sum + course.mark * course.credits,
    0
  );

  const average = weightedTotal / totalCredits;
  const averageOutOf100 = (average / max) * 100;

  averageValue.textContent = `${average.toFixed(2)} / ${max}`;
  gpaValue.textContent = "--";

  gpaNote.textContent =
    `${resultLabel} weighted average equals ${averageOutOf100.toFixed(2)}%.`;

  overallStatus.textContent = resultLabel;
  overallStatus.className = "status-pill not-ready";

  resultBody.innerHTML = marks
    .map(
      (course) => `
        <tr>
          <td>${course.name || course.code}</td>
          <td>${course.credits}</td>
          <td>${course.mark} / ${max}</td>
          <td>
            <span class="course-status not-ready">
              Recorded
            </span>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderCourseGradeResults(marks) {
  const totalCredits = marks.reduce(
    (sum, course) => sum + course.credits,
    0
  );

  const weightedTotal = marks.reduce(
    (sum, course) =>
      sum + course.mark * course.credits,
    0
  );

  const average = weightedTotal / totalCredits;
  const gpa = calculateGpa(average);

  const coursesWithStatus = marks.map((course) => ({
    ...course,
    status: getCourseStatus(course.mark, average)
  }));

  const hasFailedCourse = coursesWithStatus.some(
    (course) => course.status === "Fail"
  );

  averageValue.textContent = average.toFixed(2);

  if (gpa === null) {
    gpaValue.textContent = "--";
    gpaNote.textContent =
      "The provided LU conversion table starts at an average of 50%.";
  } else {
    gpaValue.textContent = gpa.toFixed(2);
    gpaNote.textContent =
      "Estimated from the Lebanese University conversion ranges.";
  }

  overallStatus.textContent =
    hasFailedCourse
      ? "Fail"
      : "Pass";

  overallStatus.className =
    `status-pill ${hasFailedCourse ? "fail" : "pass"}`;

  resultBody.innerHTML = coursesWithStatus
    .map(
      (course) => `
        <tr>
          <td>${course.name || course.code}</td>
          <td>${course.credits}</td>
          <td>${course.mark} / 100</td>
          <td>
            <span class="course-status ${course.status.toLowerCase()}">
              ${course.status}
            </span>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderResults(result) {
  if (result.mode !== "final100") {
    renderStandaloneResults(result);
    return;
  }

  renderCourseGradeResults(result.marks);
}

function showValidationMessage() {
  averageValue.textContent = "--";
  gpaValue.textContent = "--";

  gpaNote.textContent =
    "Fix the invalid marks before calculating GPA.";

  overallStatus.textContent = "Check marks";
  overallStatus.className = "status-pill not-ready";

  resultBody.innerHTML = `
    <tr>
      <td colspan="4" class="empty-state">
        Fix highlighted marks to calculate results.
      </td>
    </tr>
  `;
}

function resetResults() {
  courseGrid
    .querySelectorAll("input")
    .forEach((input) => {
      input.value = "";
      input.setAttribute("aria-invalid", "false");
    });

  document
    .querySelectorAll(".error")
    .forEach((error) => {
      error.textContent = "";
    });

  averageValue.textContent = "--";
  gpaValue.textContent = "--";

  gpaNote.textContent =
    "Based on the Lebanese University conversion table";

  overallStatus.textContent = "Waiting for marks";
  overallStatus.className = "status-pill waiting";

  resultBody.innerHTML = `
    <tr>
      <td colspan="4" class="empty-state">
        Results will appear after calculation.
      </td>
    </tr>
  `;
}

buildInputs();

semesterInputs.forEach((input) => {
  input.addEventListener("change", () => {
    selectedSemester = input.value;
    buildInputs();
    resetResults();
  });
});

markModeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    selectedMarkMode = input.value;
    buildInputs();
    resetResults();
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const marks = readMarks();

  if (marks) {
    renderResults(marks);
  } else {
    showValidationMessage();
  }
});

resetButton.addEventListener("click", resetResults);
