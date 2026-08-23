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
let selectedExamType = "partial";

const courseGrid = document.querySelector("#course-grid");
const form = document.querySelector("#marks-form");
const resultBody = document.querySelector("#result-body");
const averageValue = document.querySelector("#average-value");
const gpaValue = document.querySelector("#gpa-value");
const gpaNote = document.querySelector("#gpa-note");
const overallStatus = document.querySelector("#overall-status");
const resetButton = document.querySelector("#reset-button");
const semesterInputs = document.querySelectorAll('input[name="semester"]');
const examTypeInputs = document.querySelectorAll('input[name="exam-type"]');
const noPartialInput = document.querySelector("#no-partial");

function getCourses() {
  return semesters[selectedSemester].courses;
}

function isNoPartialSelected() {
  return selectedExamType === "final" && noPartialInput.checked;
}

function getInputConfig() {
  if (selectedExamType === "partial") {
    return {
      mode: "partial",
      fields: [
        {
          key: "partial",
          label: "Partial /30",
          max: 30,
          placeholder: "0 - 30",
          required: true
        }
      ]
    };
  }

  if (isNoPartialSelected()) {
    return {
      mode: "final-no-partial",
      fields: [
        {
          key: "final",
          label: "Final grade /100",
          max: 100,
          placeholder: "0 - 100",
          required: true
        }
      ]
    };
  }

  return {
    mode: "final-with-partial",
    fields: [
      {
        key: "partial",
        label: "Partial /30",
        max: 30,
        placeholder: "0 - 30",
        required: true
      },
      {
        key: "final",
        label: "Final /70",
        max: 70,
        placeholder: "0 - 70",
        required: true
      }
    ]
  };
}

function buildInputs() {
  const config = getInputConfig();
  const inputClass =
    config.fields.length === 1
      ? "mark-inputs single"
      : "mark-inputs";

  courseGrid.innerHTML = getCourses()
    .map(
      (course) => `
        <div class="course-field">
          <label for="${course.code}-${config.fields[0].key}">
            <span>${course.name || course.code}</span>
            <span class="credits">${course.credits} credits</span>
          </label>

          <div class="${inputClass}">
            ${config.fields
              .map(
                (field) => `
                  <label class="mark-input" for="${course.code}-${field.key}">
                    <span>${field.label}</span>

                    <input
                      id="${course.code}-${field.key}"
                      name="${course.code}-${field.key}"
                      type="number"
                      min="0"
                      max="${field.max}"
                      step="0.01"
                      inputmode="decimal"
                      placeholder="${field.placeholder}"
                      ${field.required ? "required" : ""}
                    >
                  </label>
                `
              )
              .join("")}
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

function validateField(input, field) {
  const value = input.value.trim();
  const mark = Number(value);
  const isEmpty = value === "";

  const isInvalid =
    isEmpty ||
    Number.isNaN(mark) ||
    mark < 0 ||
    mark > field.max;

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
    const fieldMarks = {};
    const invalidFields = [];

    config.fields.forEach((field) => {
      const input = document.querySelector(`#${course.code}-${field.key}`);
      const result = validateField(input, field);

      fieldMarks[field.key] = result.mark;

      if (result.isInvalid) {
        invalidFields.push(field.label);
      }
    });

    error.textContent = invalidFields.length > 0
      ? "Enter valid marks for this course."
      : "";

    if (invalidFields.length > 0) {
      hasError = true;
    }

    const mark =
      config.mode === "partial"
        ? fieldMarks.partial
        : (fieldMarks.partial || 0) + fieldMarks.final;

    return {
      ...course,
      ...fieldMarks,
      mark
    };
  });

  return hasError
    ? null
    : {
      mode: config.mode,
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

function renderPartialResults(marks) {
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
  const averageOutOf100 = (average / 30) * 100;

  averageValue.textContent = `${average.toFixed(2)} / 30`;
  gpaValue.textContent = "--";

  gpaNote.textContent =
    `Partial weighted average equals ${averageOutOf100.toFixed(2)}% of the partial mark.`;

  overallStatus.textContent = "Partial only";
  overallStatus.className = "status-pill not-ready";

  resultBody.innerHTML = marks
    .map(
      (course) => `
        <tr>
          <td>${course.name || course.code}</td>
          <td>${course.credits}</td>
          <td>${course.mark.toFixed(2)} / 30</td>
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

function renderFinalResults(marks, mode) {
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
          <td>${formatCourseMark(course, mode)}</td>
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

function formatCourseMark(course, mode) {
  if (mode === "final-no-partial") {
    return `${course.final.toFixed(2)} / 100`;
  }

  return `${course.partial.toFixed(2)} + ${course.final.toFixed(2)} = ${course.mark.toFixed(2)}`;
}

function renderResults(result) {
  if (result.mode === "partial") {
    renderPartialResults(result.marks);
    return;
  }

  renderFinalResults(result.marks, result.mode);
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

examTypeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    selectedExamType = input.value;
    buildInputs();
    resetResults();
  });
});

noPartialInput.addEventListener("change", () => {
  buildInputs();
  resetResults();
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
