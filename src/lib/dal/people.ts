import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { Interaction } from "@/models/interaction";
import { Person } from "@/models/person";

import { requireUser } from "./auth";

export async function getPersonById(personId: string) {
  await connectToDatabase();
  const user = await requireUser();

  return Person.findOne({
    _id: personId,
    userId: user.id,
  });
}

export async function getPersonByPublicId(publicId: string) {
  await connectToDatabase();
  const user = await requireUser();

  return Person.findOne({
    publicId,
    userId: user.id,
  });
}

export async function listPeople() {
  await connectToDatabase();
  const user = await requireUser();

  return Person.find({
    userId: user.id,
  })
    .sort({ fullName: 1 })
    .lean();
}

type ListPeopleOptions = {
  query?: string;
  circle?: string;
  relationship?: string;
  location?: string;
  status?: string;
  tag?: string;
  interest?: string;
  ageMin?: string;
  ageMax?: string;
  birthdayMonth?: string;
  birthdayDay?: string;
  sort?:
    | "name_asc"
    | "name_desc"
    | "age_asc"
    | "age_desc"
    | "birthday_upcoming"
    | "last_interaction_recent"
    | "recently_added"
    | "recently_updated";
};

function getAge(person: { dateOfBirth?: { year?: number; month?: number; day?: number } }) {
  const birthYear = person.dateOfBirth?.year;
  const birthMonth = person.dateOfBirth?.month;
  const birthDay = person.dateOfBirth?.day;

  if (!birthYear) {
    return undefined;
  }

  const today = new Date();
  let age = today.getFullYear() - birthYear;
  if (birthMonth && birthDay) {
    const hasHadBirthdayThisYear =
      today.getMonth() + 1 > birthMonth ||
      (today.getMonth() + 1 === birthMonth && today.getDate() >= birthDay);
    if (!hasHadBirthdayThisYear) {
      age -= 1;
    }
  }

  return age;
}

function getNextBirthdayTime(person: { dateOfBirth?: { month?: number; day?: number } }) {
  const month = person.dateOfBirth?.month;
  const day = person.dateOfBirth?.day;

  if (!month || !day) {
    return Number.POSITIVE_INFINITY;
  }

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisYearBirthday = new Date(thisYear, month - 1, day);

  if (thisYearBirthday.getTime() >= now.getTime()) {
    return thisYearBirthday.getTime();
  }

  return new Date(thisYear + 1, month - 1, day).getTime();
}

export async function listPeopleWithFilters(options: ListPeopleOptions) {
  await connectToDatabase();
  const user = await requireUser();

  const query = (options.query ?? "").trim();
  const circle = (options.circle ?? "").trim();
  const relationship = (options.relationship ?? "").trim();
  const location = (options.location ?? "").trim();
  const status = (options.status ?? "").trim();
  const tag = (options.tag ?? "").trim();
  const interest = (options.interest ?? "").trim();
  const ageMin = Number((options.ageMin ?? "").trim());
  const ageMax = Number((options.ageMax ?? "").trim());
  const birthdayMonth = Number((options.birthdayMonth ?? "").trim());
  const birthdayDay = Number((options.birthdayDay ?? "").trim());

  const filters: Record<string, unknown> = {
    userId: user.id,
  };

  if (query) {
    const qRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filters.$or = [
      { fullName: qRegex },
      { aliases: qRegex },
      { tags: qRegex },
      { interests: qRegex },
    ];
  }

  if (circle) {
    filters.circles = new RegExp(circle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }

  if (relationship) {
    filters["relationshipToMe.type"] = new RegExp(
      relationship.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
  }

  if (location) {
    const locationRegex = new RegExp(
      location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    filters.$and = [
      {
        $or: [
          { "livesIn.displayName": locationRegex },
          { "from.displayName": locationRegex },
        ],
      },
    ];
  }

  if (status) {
    filters.status = status;
  }

  if (tag) {
    filters.tags = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }

  if (interest) {
    filters.interests = new RegExp(
      interest.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
  }

  const people = await Person.find({
    ...filters,
  })
    .sort({ fullName: 1 })
    .lean();

  const filteredPeople = people.filter((person) => {
    if (Number.isFinite(ageMin) || Number.isFinite(ageMax)) {
      const age = getAge(person);
      if (age === undefined) {
        return false;
      }
      if (Number.isFinite(ageMin) && age < ageMin) {
        return false;
      }
      if (Number.isFinite(ageMax) && age > ageMax) {
        return false;
      }
    }

    if (Number.isFinite(birthdayMonth)) {
      if (person.dateOfBirth?.month !== birthdayMonth) {
        return false;
      }
    }

    if (Number.isFinite(birthdayDay)) {
      if (person.dateOfBirth?.day !== birthdayDay) {
        return false;
      }
    }

    return true;
  });

  const selectedSort = options.sort ?? "name_asc";
  if (selectedSort === "name_asc") {
    return filteredPeople.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  if (selectedSort === "name_desc") {
    return filteredPeople.sort((a, b) => b.fullName.localeCompare(a.fullName));
  }

  if (selectedSort === "recently_added") {
    return filteredPeople.sort(
      (a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime(),
    );
  }

  if (selectedSort === "recently_updated") {
    return filteredPeople.sort(
      (a, b) => new Date(String(b.updatedAt)).getTime() - new Date(String(a.updatedAt)).getTime(),
    );
  }

  if (selectedSort === "age_asc") {
    return filteredPeople.sort((a, b) => {
      const ageA = getAge(a);
      const ageB = getAge(b);
      if (ageA === undefined && ageB === undefined) {
        return a.fullName.localeCompare(b.fullName);
      }
      if (ageA === undefined) {
        return 1;
      }
      if (ageB === undefined) {
        return -1;
      }
      return ageA - ageB;
    });
  }

  if (selectedSort === "age_desc") {
    return filteredPeople.sort((a, b) => {
      const ageA = getAge(a);
      const ageB = getAge(b);
      if (ageA === undefined && ageB === undefined) {
        return a.fullName.localeCompare(b.fullName);
      }
      if (ageA === undefined) {
        return 1;
      }
      if (ageB === undefined) {
        return -1;
      }
      return ageB - ageA;
    });
  }

  if (selectedSort === "birthday_upcoming") {
    return filteredPeople.sort((a, b) => getNextBirthdayTime(a) - getNextBirthdayTime(b));
  }

  const personIds = filteredPeople.map((person) => String(person._id));
  if (personIds.length === 0) {
    return filteredPeople;
  }

  const interactionAgg = await Interaction.aggregate<{ _id: string; lastInteraction: Date }>([
    {
      $match: {
        userId: user.id,
        personIds: { $in: personIds },
      },
    },
    { $unwind: "$personIds" },
    {
      $match: {
        personIds: { $in: personIds },
      },
    },
    {
      $group: {
        _id: "$personIds",
        lastInteraction: { $max: "$date" },
      },
    },
  ]);

  const lastInteractionByPersonId = new Map(
    interactionAgg.map((item) => [String(item._id), new Date(item.lastInteraction).getTime()]),
  );

  return filteredPeople.sort((a, b) => {
    const aTime = lastInteractionByPersonId.get(String(a._id)) ?? 0;
    const bTime = lastInteractionByPersonId.get(String(b._id)) ?? 0;
    return bTime - aTime;
  });
}

export async function listPeopleByIds(personIds: string[]) {
  await connectToDatabase();
  const user = await requireUser();

  if (personIds.length === 0) {
    return [];
  }

  return Person.find({
    userId: user.id,
    _id: { $in: personIds },
  })
    .select({ _id: 1, publicId: 1, fullName: 1 })
    .lean();
}